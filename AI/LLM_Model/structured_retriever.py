import re
from datetime import datetime, timedelta
from typing import List, Optional, Tuple, Set

from config import (
    POSTGRES_DSN,
    STRUCTURED_DB_TIMEOUT_MS,
    STRUCTURED_TOP_CLINICS,
    STRUCTURED_TOP_SERVICES,
    STRUCTURED_TOP_VETS,
)


class StructuredDBRetriever:
    CHATBOT_HISTORY_KEYWORDS = [
        "chatbot",
        "chat bot",
        "chat history",
        "lịch sử chat",
        "lich su chat",
        "lịch sử trò chuyện",
        "lich su tro chuyen",
        "tin nhắn cũ",
        "tin nhan cu",
        "chatbot_room",
        "chatbot_message",
        "phòng chat",
        "phong chat",
    ]

    SPECIALTY_LABELS = {
        "GENERAL_EXAMINATION": "Khám tổng quát",
        "INTERNAL_MEDICINE": "Nội khoa",
        "SURGERY": "Phẫu thuật",
        "ULTRASOUND": "Siêu âm",
        "VACCINATION_AND_PREVENTION": "Tiêm phòng & phòng bệnh",
    }

    DB_INTENT_KEYWORDS = {
        "clinic": [
            "phòng khám",
            "phong kham",
            "địa chỉ",
            "dia chi",
            "sđt",
            "sdt",
            "liên hệ",
            "lien he",
            "gần nhất",
            "gan nhat",
            "chi nhánh",
            "chi nhanh",
        ],
        "service": [
            "dịch vụ",
            "dich vu",
            "giá",
            "gia",
            "chi phí",
            "chi phi",
            "dịch vụ khám",
            "dich vu kham",
            "tiêm",
            "tiem",
            "xét nghiệm",
            "xet nghiem",
        ],
        "vet": [
            "bác sĩ",
            "bac si",
            "chuyên môn",
            "chuyen mon",
            "thú y",
            "thu y",
            "lịch trống",
            "lich trong",
            "rảnh",
            "ranh",
            "đặt lịch",
            "dat lich",
            "appointment",
        ],
        "policy": [
            "quy định",
            "quy dinh",
            "nội quy",
            "noi quy",
            "quy trình",
            "quy trinh",
            "giờ mở cửa",
            "gio mo cua",
            "làm việc",
            "lam viec",
        ],
        "restricted": [
            "bệnh án",
            "benh an",
            "hồ sơ khám",
            "ho so kham",
            "medical record",
            "hóa đơn",
            "hoa don",
            "invoice",
            "thanh toán",
            "thanh toan",
            "chủ nuôi",
            "chu nuoi",
            "pet_owner",
            "triệu chứng của",
            "trieu chung cua",
            "chẩn đoán của",
            "chan doan cua",
        ],
    }

    def __init__(self):
        self.enabled = False
        self.init_error: Optional[str] = None
        self._psycopg = None
        self._connect_timeout = max(1, STRUCTURED_DB_TIMEOUT_MS // 1000)

        if not POSTGRES_DSN:
            return

        try:
            import psycopg
        except Exception:
            self.init_error = "psycopg is not installed"
            return

        self._psycopg = psycopg
        try:
            with self._connect() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1")
                    cur.fetchone()
            self.enabled = True
        except Exception as e:
            self.init_error = str(e)
            self.enabled = False

    @classmethod
    def detect_intents(cls, question: str) -> Set[str]:
        q = (question or "").lower()
        if any(k in q for k in cls.CHATBOT_HISTORY_KEYWORDS):
            return set()

        intents: Set[str] = set()
        for intent, keywords in cls.DB_INTENT_KEYWORDS.items():
            if any(k in q for k in keywords):
                intents.add(intent)
        return intents

    def _connect(self):
        return self._psycopg.connect(
            POSTGRES_DSN,
            connect_timeout=self._connect_timeout,
            options=f"-c statement_timeout={STRUCTURED_DB_TIMEOUT_MS}",
        )

    def _parse_date_time(self, question: str) -> Tuple[Optional[str], Optional[str]]:
        q = question.strip()
        q_lower = q.lower()

        today = datetime.now()
        if "hôm nay" in q_lower or "hom nay" in q_lower:
            date_match_value = today.strftime("%Y-%m-%d")
        elif "ngày mai" in q_lower or "ngay mai" in q_lower or "mai" in q_lower:
            date_match_value = (today + timedelta(days=1)).strftime("%Y-%m-%d")
        else:
            date_match_value = None

        date_match = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", q)
        if date_match:
            date_match_value = date_match.group(1)
        elif not date_match_value:
            vn_date_match = re.search(r"\b(\d{1,2})/(\d{1,2})/(\d{4})\b", q)
            if vn_date_match:
                d, m, y = vn_date_match.groups()
                try:
                    dt = datetime(int(y), int(m), int(d))
                    date_match_value = dt.strftime("%Y-%m-%d")
                except ValueError:
                    date_match_value = None
            else:
                date_match_value = None

        time_match = re.search(r"\b([01]?\d|2[0-3]):([0-5]\d)\b", q)
        if time_match:
            time_match_value = f"{int(time_match.group(1)):02d}:{time_match.group(2)}:00"
        else:
            time_match_value = None

        return date_match_value, time_match_value

    @staticmethod
    def _extract_specialty_filter(question: str) -> Optional[str]:
        q = (question or "").lower()
        mapping = {
            "GENERAL_EXAMINATION": ["khám tổng", "kham tong", "khám thường", "tong quat", "general"],
            "INTERNAL_MEDICINE": ["nội", "noi khoa", "internal"],
            "SURGERY": ["phẫu", "phau thuat", "surgery"],
            "ULTRASOUND": ["siêu âm", "sieu am", "ultrasound"],
            "VACCINATION_AND_PREVENTION": ["tiêm", "tiem", "phòng bệnh", "vaccin", "vaccine"],
        }
        for enum_value, markers in mapping.items():
            if any(m in q for m in markers):
                return enum_value
        return None

    @staticmethod
    def _extract_appointment_status(question: str) -> Optional[str]:
        q = (question or "").lower()
        if any(m in q for m in ["đã hủy", "da huy", "huỷ", "huy", "cancel", "cancelled"]):
            return "CANCELLED"
        if any(m in q for m in ["hoàn thành", "hoan thanh", "completed"]):
            return "COMPLETED"
        if any(m in q for m in ["đang khám", "dang kham", "in progress", "in_progress"]):
            return "IN_PROGRESS"
        if any(m in q for m in ["đã đặt", "da dat", "booked", "book"]):
            return "BOOKED"
        return None

    @staticmethod
    def _safe_pattern(question: str) -> str:
        return f"%{(question or '').strip()}%"

    def _has_restricted_intent(self, intents: Set[str]) -> bool:
        return "restricted" in intents

    def _query_clinics(self, conn, question: str) -> List[str]:
        pattern = f"%{question}%"
        sql = """
            SELECT c.name, c.address, c.phone
            FROM public.clinic c
            WHERE c.deleted = false
              AND (
                c.name ILIKE %s
                OR c.address ILIKE %s
              )
            ORDER BY c.name
            LIMIT %s;
        """

        with conn.cursor() as cur:
            cur.execute(sql, (pattern, pattern, STRUCTURED_TOP_CLINICS))
            rows = cur.fetchall()

        if not rows:
            sql_fallback = """
                SELECT c.name, c.address, c.phone
                FROM public.clinic c
                WHERE c.deleted = false
                ORDER BY c.name
                LIMIT %s;
            """
            with conn.cursor() as cur:
                cur.execute(sql_fallback, (STRUCTURED_TOP_CLINICS,))
                rows = cur.fetchall()

        return [f"Phòng khám: {r[0]} | Địa chỉ: {r[1]} | SĐT: {r[2]}" for r in rows]

    @staticmethod
    def _looks_like_count_question(question: str) -> bool:
        q = (question or "").lower()
        count_markers = ["bao nhiêu", "bao nhieu", "tổng số", "tong so", "số lượng", "so luong", "count"]
        return any(m in q for m in count_markers)

    @staticmethod
    def _looks_like_list_question(question: str) -> bool:
        q = (question or "").lower()
        list_markers = ["danh sách", "danh sach", "liệt kê", "liet ke", "gồm những", "gom nhung", "show", "list"]
        return any(m in q for m in list_markers)

    def _count_clinics(self, conn) -> int:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT COUNT(*)
                FROM public.clinic c
                WHERE c.deleted = false;
                """
            )
            row = cur.fetchone()
        return int(row[0] if row else 0)

    def _count_services(self, conn) -> int:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM public.medical_order;")
            row = cur.fetchone()
        return int(row[0] if row else 0)

    def _count_vets(self, conn) -> int:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT COUNT(*)
                FROM public.veterinarian v
                JOIN public."user" u ON u.id = v.user_id
                WHERE u.deleted = false;
                """
            )
            row = cur.fetchone()
        return int(row[0] if row else 0)

    def _count_available_vets(self, conn, question: str, appointment_date: str, appointment_time: str) -> int:
        specialty_pattern = f"%{question}%"
        specialty_enum = self._extract_specialty_filter(question)
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT COUNT(*)
                FROM public.veterinarian v
                JOIN public."user" u ON u.id = v.user_id
                JOIN public.clinic c ON c.id = v.clinic_id
                WHERE u.deleted = false
                                    AND c.deleted = false
                  AND (
                    v.specialty::text ILIKE %s
                    OR u.full_name ILIKE %s
                    OR c.name ILIKE %s
                  )
                                    AND (%s::text IS NULL OR v.specialty::text = %s::text)
                  AND NOT EXISTS (
                    SELECT 1
                    FROM public.appointment a
                    WHERE a.veterinarian_id = v.user_id
                      AND a.appointment_date = %s::date
                      AND a.appointment_time = %s::time
                                            AND a.status IN ('BOOKED', 'IN_PROGRESS')
                  );
                """,
                                (
                                        specialty_pattern,
                                        specialty_pattern,
                                        specialty_pattern,
                                        specialty_enum,
                                        specialty_enum,
                                        appointment_date,
                                        appointment_time,
                                ),
            )
            row = cur.fetchone()
        return int(row[0] if row else 0)

    def _query_services(self, conn, question: str) -> List[str]:
        pattern = f"%{question}%"
        sql = """
            SELECT mo.name_vn, mo.name_eng, mo.price
            FROM public.medical_order mo
            WHERE mo.name_vn ILIKE %s OR mo.name_eng ILIKE %s
            ORDER BY mo.price ASC
            LIMIT %s;
        """
        with conn.cursor() as cur:
            cur.execute(sql, (pattern, pattern, STRUCTURED_TOP_SERVICES))
            rows = cur.fetchall()

        if not rows:
            sql_fallback = """
                SELECT mo.name_vn, mo.name_eng, mo.price
                FROM public.medical_order mo
                ORDER BY mo.created_at DESC
                LIMIT %s;
            """
            with conn.cursor() as cur:
                cur.execute(sql_fallback, (STRUCTURED_TOP_SERVICES,))
                rows = cur.fetchall()

        return [f"Dịch vụ: {r[0]} ({r[1]}) | Giá tham khảo: {r[2]} VND" for r in rows]

    def _query_available_vets(
        self,
        conn,
        question: str,
        appointment_date: Optional[str],
        appointment_time: Optional[str],
    ) -> List[str]:
        specialty_pattern = f"%{question}%"
        specialty_enum = self._extract_specialty_filter(question)
        appointment_status = self._extract_appointment_status(question)

        base_sql = """
            SELECT
                u.full_name,
                v.specialty,
                c.name,
                (
                    SELECT COUNT(*)
                    FROM public.appointment a2
                    WHERE a2.veterinarian_id = v.user_id
                      AND a2.status IN ('BOOKED', 'IN_PROGRESS')
                ) AS active_appointments
            FROM public.veterinarian v
            JOIN public."user" u ON u.id = v.user_id
            JOIN public.clinic c ON c.id = v.clinic_id
            WHERE u.deleted = false
              AND c.deleted = false
              AND (
                v.specialty::text ILIKE %s
                OR u.full_name ILIKE %s
                OR c.name ILIKE %s
              )
              AND (%s::text IS NULL OR v.specialty::text = %s::text)
        """

        params = [specialty_pattern, specialty_pattern, specialty_pattern, specialty_enum, specialty_enum]

        if appointment_status:
            base_sql += """
              AND EXISTS (
                SELECT 1
                FROM public.appointment a
                WHERE a.veterinarian_id = v.user_id
                  AND a.status = %s
              )
            """
            params.append(appointment_status)

        if appointment_date and appointment_time:
            base_sql += """
              AND NOT EXISTS (
                SELECT 1
                FROM public.appointment a
                WHERE a.veterinarian_id = v.user_id
                  AND a.appointment_date = %s::date
                  AND a.appointment_time = %s::time
                  AND a.status IN ('BOOKED', 'IN_PROGRESS')
              )
            """
            params.extend([appointment_date, appointment_time])

        base_sql += """
            ORDER BY c.name, active_appointments ASC, u.full_name
            LIMIT %s;
        """
        params.append(STRUCTURED_TOP_VETS)

        with conn.cursor() as cur:
            cur.execute(base_sql, tuple(params))
            rows = cur.fetchall()

        return [
            f"Bác sĩ: {r[0]} | Chuyên môn: {self.SPECIALTY_LABELS.get(r[1], r[1])} | Phòng khám: {r[2]} | Lịch đang xử lý: {r[3]}"
            for r in rows
        ]

    def _query_clinic_vet_capacity(self, conn, question: str) -> List[str]:
        pattern = self._safe_pattern(question)
        specialty_enum = self._extract_specialty_filter(question)

        sql = """
            SELECT c.name, v.specialty, COUNT(*) AS vet_count
            FROM public.veterinarian v
            JOIN public."user" u ON u.id = v.user_id
            JOIN public.clinic c ON c.id = v.clinic_id
            WHERE u.deleted = false
              AND c.deleted = false
              AND (
                c.name ILIKE %s
                OR c.address ILIKE %s
                OR v.specialty::text ILIKE %s
              )
              AND (%s::text IS NULL OR v.specialty::text = %s::text)
            GROUP BY c.name, v.specialty
            ORDER BY c.name, vet_count DESC
            LIMIT %s;
        """

        with conn.cursor() as cur:
            cur.execute(
                sql,
                (pattern, pattern, pattern, specialty_enum, specialty_enum, STRUCTURED_TOP_VETS),
            )
            rows = cur.fetchall()

        return [
            f"Năng lực phòng khám: {r[0]} | Chuyên ngành: {self.SPECIALTY_LABELS.get(r[1], r[1])} | Số bác sĩ: {r[2]}"
            for r in rows
        ]

    def _query_available_vet_by_clinic(self, conn, question: str, appointment_date: Optional[str], appointment_time: Optional[str]) -> List[str]:
        if not (appointment_date and appointment_time):
            return [
                "Để kiểm tra bác sĩ còn rảnh theo giờ cụ thể, vui lòng cung cấp ngày và giờ dạng YYYY-MM-DD HH:MM (hoặc DD/MM/YYYY HH:MM)."
            ]

        pattern = self._safe_pattern(question)
        specialty_enum = self._extract_specialty_filter(question)

        sql = """
            SELECT c.name, COUNT(*) AS available_vets
            FROM public.veterinarian v
            JOIN public."user" u ON u.id = v.user_id
            JOIN public.clinic c ON c.id = v.clinic_id
            WHERE u.deleted = false
              AND c.deleted = false
              AND (
                c.name ILIKE %s
                OR c.address ILIKE %s
                OR v.specialty::text ILIKE %s
              )
              AND (%s::text IS NULL OR v.specialty::text = %s::text)
              AND NOT EXISTS (
                SELECT 1
                FROM public.appointment a
                WHERE a.veterinarian_id = v.user_id
                  AND a.appointment_date = %s::date
                  AND a.appointment_time = %s::time
                  AND a.status IN ('BOOKED', 'IN_PROGRESS')
              )
            GROUP BY c.name
            ORDER BY available_vets DESC, c.name
            LIMIT %s;
        """

        with conn.cursor() as cur:
            cur.execute(
                sql,
                (
                    pattern,
                    pattern,
                    pattern,
                    specialty_enum,
                    specialty_enum,
                    appointment_date,
                    appointment_time,
                    STRUCTURED_TOP_CLINICS,
                ),
            )
            rows = cur.fetchall()

        return [
            f"Phòng khám: {r[0]} | Số bác sĩ còn rảnh lúc {appointment_date} {appointment_time[:5]}: {r[1]}"
            for r in rows
        ]

    def _query_popular_time_slots(self, conn, question: str) -> List[str]:
        pattern = self._safe_pattern(question)
        sql = """
            SELECT c.name, a.appointment_time, COUNT(*) AS booked_count
            FROM public.appointment a
            JOIN public.clinic c ON c.id = a.clinic_id
            WHERE c.deleted = false
              AND c.name ILIKE %s
              AND a.status IN ('BOOKED', 'IN_PROGRESS', 'COMPLETED')
            GROUP BY c.name, a.appointment_time
            ORDER BY c.name, booked_count DESC, a.appointment_time
            LIMIT %s;
        """
        with conn.cursor() as cur:
            cur.execute(sql, (pattern, STRUCTURED_TOP_SERVICES))
            rows = cur.fetchall()

        return [
            f"Khung giờ đông lịch: {r[0]} | Giờ: {str(r[1])[:5]} | Lượt hẹn: {r[2]}"
            for r in rows
        ]

    def _query_clinic_load(self, conn, question: str) -> List[str]:
        pattern = self._safe_pattern(question)
        sql = """
            SELECT
                c.name,
                SUM(CASE WHEN a.status = 'BOOKED' THEN 1 ELSE 0 END) AS booked_count,
                SUM(CASE WHEN a.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress_count,
                SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
                SUM(CASE WHEN a.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_count
            FROM public.clinic c
            LEFT JOIN public.appointment a ON a.clinic_id = c.id
            WHERE c.deleted = false
              AND (
                c.name ILIKE %s
                OR c.address ILIKE %s
              )
            GROUP BY c.name
            ORDER BY c.name
            LIMIT %s;
        """
        with conn.cursor() as cur:
            cur.execute(sql, (pattern, pattern, STRUCTURED_TOP_CLINICS))
            rows = cur.fetchall()

        return [
            (
                f"Tải lịch phòng khám: {r[0]} | BOOKED: {r[1]} | IN_PROGRESS: {r[2]} | "
                f"COMPLETED: {r[3]} | CANCELLED: {r[4]}"
            )
            for r in rows
        ]

    @staticmethod
    def _looks_like_capacity_question(question: str) -> bool:
        q = (question or "").lower()
        markers = [
            "bao nhiêu bác sĩ",
            "bao nhieu bac si",
            "theo chuyên ngành",
            "theo chuyen nganh",
            "năng lực",
            "nang luc",
        ]
        return any(m in q for m in markers)

    @staticmethod
    def _looks_like_availability_question(question: str) -> bool:
        q = (question or "").lower()
        markers = ["còn rảnh", "con ranh", "trống lịch", "trong lich", "khung giờ", "khung gio"]
        return any(m in q for m in markers)

    @staticmethod
    def _looks_like_load_question(question: str) -> bool:
        q = (question or "").lower()
        markers = ["tải", "tai lich", "booked", "in_progress", "cancelled", "completed", "tình trạng lịch", "tinh trang lich"]
        return any(m in q for m in markers)

    def retrieve(self, question: str, intents: Optional[Set[str]] = None) -> List[str]:
        if not self.enabled:
            return []

        intents = intents or self.detect_intents(question)
        if not intents:
            return []

        if self._has_restricted_intent(intents):
            return [
                "Vì bảo mật, chatbot chỉ trả lời dữ liệu tổng hợp công khai (phòng khám, bác sĩ, năng lực và lịch trống tổng quát), không truy xuất bệnh án/hóa đơn/thông tin cá nhân."
            ]

        try:
            with self._connect() as conn:
                date_val, time_val = self._parse_date_time(question)
                count_mode = self._looks_like_count_question(question)
                list_mode = self._looks_like_list_question(question)
                capacity_mode = self._looks_like_capacity_question(question)
                availability_mode = self._looks_like_availability_question(question)
                load_mode = self._looks_like_load_question(question)

                snippets: List[str] = []
                if count_mode:
                    if "clinic" in intents or "policy" in intents:
                        snippets.append(
                            f"Tổng số phòng khám đang hoạt động: {self._count_clinics(conn)}"
                        )
                    if "service" in intents:
                        snippets.append(f"Tổng số dịch vụ hiện có: {self._count_services(conn)}")
                    if "vet" in intents:
                        if date_val and time_val:
                            snippets.append(
                                f"Số bác sĩ trống lịch vào {date_val} {time_val[:5]}: {self._count_available_vets(conn, question, date_val, time_val)}"
                            )
                        else:
                            snippets.append(f"Tổng số bác sĩ đang hoạt động: {self._count_vets(conn)}")

                if availability_mode and ("vet" in intents or "clinic" in intents):
                    snippets.extend(
                        self._query_available_vet_by_clinic(conn, question, date_val, time_val)
                    )

                if capacity_mode and ("vet" in intents or "clinic" in intents):
                    snippets.extend(self._query_clinic_vet_capacity(conn, question))

                if load_mode and "clinic" in intents:
                    snippets.extend(self._query_clinic_load(conn, question))

                if ("clinic" in intents or "vet" in intents) and (
                    "khung giờ" in question.lower() or "khung gio" in question.lower() or "giờ đông" in question.lower() or "gio dong" in question.lower()
                ):
                    snippets.extend(self._query_popular_time_slots(conn, question))

                if (not count_mode) or list_mode:
                    if "clinic" in intents or "policy" in intents:
                        snippets.extend(self._query_clinics(conn, question))
                    if "service" in intents:
                        snippets.extend(self._query_services(conn, question))
                    if "vet" in intents:
                        snippets.extend(
                            self._query_available_vets(conn, question, date_val, time_val)
                        )

                deduped: List[str] = []
                seen = set()
                for s in snippets:
                    if s not in seen:
                        seen.add(s)
                        deduped.append(s)
                return deduped
        except Exception as e:
            print(f"Structured DB query failed: {e}")
            return []
