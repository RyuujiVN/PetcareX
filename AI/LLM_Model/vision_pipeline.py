import torch
import threading
from transformers import Qwen2VLForConditionalGeneration, AutoProcessor
from qwen_vl_utils import process_vision_info
from config import VISION_MODEL_NAME, VISION_DEVICE, VISION_PROMPT, SYSTEM_PROMPT
import gc
class VisionAnalyzer:
    def __init__(self):
        print("Loading model and processor...")
        self.processor = AutoProcessor.from_pretrained(VISION_MODEL_NAME)
        self.model = Qwen2VLForConditionalGeneration.from_pretrained(VISION_MODEL_NAME, torch_dtype="auto", device_map=VISION_DEVICE)
        self.lock = threading.Lock()  

    def describe_image(self, base64_image: str) -> str:
        if not base64_image.startswith("data:"):
            base64_image =  f"data:image/jpeg;base64,{base64_image}"
        inputs = None
        generated_ids = None
        try:
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "image": base64_image},
                        {"type": "text", "text": VISION_PROMPT},
                    ],
                }
            ]
            text = self.processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            image_inputs, video_inputs = process_vision_info(messages)
            inputs = self.processor(
                text=[text],
                images=image_inputs,
                videos=video_inputs,
                padding=True,
                return_tensors="pt",
            ).to(VISION_DEVICE)

            with self.lock:
                with torch.no_grad():
                    generated_ids =  self.model.generate(**inputs, max_new_tokens=128, temperature=0.3, top_p=0.9, do_sample=False)
                    generated_ids_trimmed = [
                        out_ids[len(in_ids) :] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
                    ]
                    output_text = self.processor.batch_decode(
                        generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
                    )
                    
            return output_text[0].strip()
        except Exception as e:
            print(f"Error in describe_image: {e}")
            return "Xin lỗi, tôi không thể phân tích bức ảnh này. Vui lòng thử lại với một bức ảnh khác hoặc hỏi về các triệu chứng cụ thể của thú cưng."
        finally:
            if inputs is not None:
                del inputs
            if generated_ids is not None:
                del generated_ids
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()   
