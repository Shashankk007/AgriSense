import os
import json
import requests
from io import BytesIO
from PIL import Image
import torch
import torchvision.transforms as transforms
import logging
from urllib.parse import urlparse
from chatbot.config.settings import get_settings

logger = logging.getLogger(__name__)

MAX_IMAGE_BYTES = 15 * 1024 * 1024


def fetch_image(image_url: str) -> Image.Image:
    """
    Downloads an image for inference. Only https URLs on the allow-listed hosts
    (default: Cloudinary) are fetched, so this endpoint can't be used to make the server
    request arbitrary internal/external URLs (SSRF).
    """
    parsed = urlparse(image_url)
    allowed = [h.strip().lower() for h in get_settings().ALLOWED_IMAGE_HOSTS.split(",") if h.strip()]
    if parsed.scheme != "https" or (parsed.hostname or "").lower() not in allowed:
        raise ValueError("image_url must be an https URL on an allowed image host")
    response = requests.get(image_url, timeout=20, stream=True)
    response.raise_for_status()
    data = response.raw.read(MAX_IMAGE_BYTES + 1, decode_content=True)
    if len(data) > MAX_IMAGE_BYTES:
        raise ValueError("Image is too large")
    return Image.open(BytesIO(data)).convert("RGB")


class NoDetectionError(Exception):
    """The image is valid but the model found nothing to report."""


class PredictionService:
    def __init__(self):
        settings = get_settings()
        device_pref = settings.ML_DEVICE.lower()
        if device_pref == 'cuda' and torch.cuda.is_available():
            self.device = torch.device('cuda')
            logger.info("Running ML models on GPU (CUDA)")
        else:
            self.device = torch.device('cpu')
            logger.info("Running ML models on CPU")
        
        # Load disease details
        self.disease_details = {}
        disease_json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'disease_detail.json')
        if os.path.exists(disease_json_path):
            with open(disease_json_path, 'r') as f:
                self.disease_details = json.load(f)
                
        # Load pest details
        self.pest_details = {}
        pest_json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'pest_detail.json')
        if os.path.exists(pest_json_path):
            with open(pest_json_path, 'r') as f:
                self.pest_details = json.load(f)

        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

        # Try to load models if they exist
        self.disease_model = None
        self.disease_classes = sorted(list(self.disease_details.keys())) if self.disease_details else ["Rice_leaf_blast"]
        disease_model_path = os.path.join(os.path.dirname(__file__), '..', 'disease_model.pt')
        if os.path.exists(disease_model_path):
            try:
                from torchvision.models import efficientnet_b0
                num_classes = len(self.disease_classes)
                self.disease_model = efficientnet_b0(weights=None)
                self.disease_model.classifier[1] = torch.nn.Linear(self.disease_model.classifier[1].in_features, num_classes)
                
                state_dict = torch.load(disease_model_path, map_location=self.device)
                self.disease_model.load_state_dict(state_dict)
                self.disease_model.to(self.device)
                self.disease_model.eval()
            except Exception as e:
                logger.error(f"Failed to load disease model: {e}")
                self.disease_model = None

        self.pest_model = None
        self.pest_classes = ["0", "1"] # Extend as needed based on pest_detail.json
        pest_model_path = os.path.join(os.path.dirname(__file__), '..', 'pest_model.pt')
        if os.path.exists(pest_model_path):
            try:
                try:
                    torch.serialization.add_safe_globals(["ultralytics.nn.tasks.DetectionModel"])
                except Exception:
                    pass
                from ultralytics import YOLO
                self.pest_model = YOLO(pest_model_path)
            except Exception as e:
                logger.error(f"Failed to load pest model: {e}")
                self.pest_model = None

    def predict_disease(self, image_url: str):
        try:
            if not self.disease_model:
                raise Exception("Disease prediction model is not available or failed to load. Please configure the correct model weights.")

            img = fetch_image(image_url)
            tensor = self.transform(img).unsqueeze(0).to(self.device)

            with torch.no_grad():
                output = self.disease_model(tensor)
                probabilities = torch.nn.functional.softmax(output[0], dim=0)
                conf, predicted_idx = torch.max(probabilities, 0)
                
                # In real scenario, map idx to actual class name
                class_name = self.disease_classes[predicted_idx.item()] if predicted_idx.item() < len(self.disease_classes) else "Unknown"
                details = self.disease_details.get(class_name, {})
                
                return {
                    "class": class_name,
                    "confidence_score": round(conf.item() * 100, 2),
                    "details": details
                }
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            raise Exception(f"Failed to process image: {e}")

    def predict_pest(self, image_url: str):
        try:
            if not self.pest_model:
                raise Exception("Pest prediction model is not available or failed to load. Please configure the correct model weights.")

            img = fetch_image(image_url)
            # Use YOLO model directly on PIL image
            results = self.pest_model(img)
            
            # Check if any detection was made
            if len(results) > 0 and len(results[0].boxes) > 0:
                boxes = results[0].boxes
                best_idx = torch.argmax(boxes.conf).item()
                predicted_class_id = str(int(boxes.cls[best_idx].item()))
                confidence = float(boxes.conf[best_idx].item()) * 100
            else:
                raise NoDetectionError("No pest detected in the image. Try a closer, clearer photo of the pest.")

            details = self.pest_details.get(predicted_class_id, {})
            
            return {
                "class": predicted_class_id,
                "confidence_score": confidence,
                "details": details
            }
        except (ValueError, NoDetectionError):
            raise
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            raise Exception(f"Failed to process image: {e}")
