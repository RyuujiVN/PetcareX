import re
from datetime import datetime
from typing import List, Optional, Tuple, Set

from config import (
    POSTGRES_DSN,
    STRUCTURED_DB_TIMEOUT_MS,
    STRUCTURED_TOP_CLINICS,
    STRUCTURED_TOP_SERVICES,
    STRUCTURED_TOP_VETS,
)


class StructuredDBRetriever:
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

        date_match = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", q)
        if not date_match:
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
        else:
            date_match_value = date_match.group(1)

        time_match = re.search(r"\b([01]?\d|2[0-3]):([0-5]\d)\b", q)
        if time_match:
            time_match_value = f"{int(time_match.group(1)):02d}:{time_match.group(2)}:00"
        else:
            time_match_value = None

        return date_match_value, time_match_value

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
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT COUNT(*)
                FROM public.veterinarian v
                JOIN public."user" u ON u.id = v.user_id
                JOIN public.clinic c ON c.id = v.clinic_id
                WHERE u.deleted = false
                  AND (
                    v.specialty::text ILIKE %s
                    OR u.full_name ILIKE %s
                    OR c.name ILIKE %s
                  )
                  AND NOT EXISTS (
                    SELECT 1
                    FROM public.appointment a
                    WHERE a.veterinarian_id = v.user_id
                      AND a.appointment_date = %s::date
                      AND a.appointment_time = %s::time
                      AND a.status IN ('Hẹn thành công', 'Đang khám')
                  );
                """,
                (specialty_pattern, specialty_pattern, specialty_pattern, appointment_date, appointment_time),
            )
            row = cur.fetchone()
        return int(row[0] if row else 0)

    def _query_services(self, conn, question: str) -> List[str]:
        pattern = f"%{question}%"
        sql = """
            SELECT mo.name, mo.price
            FROM public.medical_order mo
            WHERE mo.name ILIKE %s
            ORDER BY mo.price ASC
            LIMIT %s;
        """
        with conn.cursor() as cur:
            cur.execute(sql, (pattern, STRUCTURED_TOP_SERVICES))
            rows = cur.fetchall()

        if not rows:
            sql_fallback = """
                SELECT mo.name, mo.price
                FROM public.medical_order mo
                ORDER BY mo.created_at DESC
                LIMIT %s;
            """
            with conn.cursor() as cur:
                cur.execute(sql_fallback, (STRUCTURED_TOP_SERVICES,))
                rows = cur.fetchall()

        return [f"Dịch vụ: {r[0]} | Giá tham khảo: {r[1]} VND" for r in rows]

    def _query_available_vets(
        self,
        conn,
        question: str,
        appointment_date: Optional[str],
        appointment_time: Optional[str],
    ) -> List[str]:
        specialty_pattern = f"%{question}%"

        base_sql = """
            SELECT u.full_name, v.specialty, c.name
            FROM public.veterinarian v
            JOIN public."user" u ON u.id = v.user_id
            JOIN public.clinic c ON c.id = v.clinic_id
            WHERE u.deleted = false
              AND (
                v.specialty::text ILIKE %s
                OR u.full_name ILIKE %s
                OR c.name ILIKE %s
              )
        """

        params = [specialty_pattern, specialty_pattern, specialty_pattern]

        if appointment_date and appointment_time:
            base_sql += """
              AND NOT EXISTS (
                SELECT 1
                FROM public.appointment a
                WHERE a.veterinarian_id = v.user_id
                  AND a.appointment_date = %s::date
                  AND a.appointment_time = %s::time
                  AND a.status IN ('Hẹn thành công', 'Đang khám')
              )
            """
            params.extend([appointment_date, appointment_time])

        base_sql += """
            ORDER BY c.name, u.full_name
            LIMIT %s;
        """
        params.append(STRUCTURED_TOP_VETS)

        with conn.cursor() as cur:
            cur.execute(base_sql, tuple(params))
            rows = cur.fetchall()

        return [f"Bác sĩ: {r[0]} | Chuyên môn: {r[1]} | Phòng khám: {r[2]}" for r in rows]

    def retrieve(self, question: str, intents: Optional[Set[str]] = None) -> List[str]:
        if not self.enabled:
            return []

        intents = intents or self.detect_intents(question)
        if not intents:
            return []

        try:
            with self._connect() as conn:
                date_val, time_val = self._parse_date_time(question)
                count_mode = self._looks_like_count_question(question)
                list_mode = self._looks_like_list_question(question)

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

                if (not count_mode) or list_mode:
                    if "clinic" in intents or "policy" in intents:
                        snippets.extend(self._query_clinics(conn, question))
                    if "service" in intents:
                        snippets.extend(self._query_services(conn, question))
                    if "vet" in intents:
                        snippets.extend(
                            self._query_available_vets(conn, question, date_val, time_val)
                        )
                return snippets
        except Exception as e:
            print(f"Structured DB query failed: {e}")
            return []
