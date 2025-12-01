import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configuración
API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    raise RuntimeError("GOOGLE_API_KEY no está definida en .env")

genai.configure(api_key=API_KEY)

# Usamos el modelo Gemini 2.0 Flash (el más reciente y gratuito)
model = genai.GenerativeModel('models/gemini-2.0-flash')

def ask_gemini(prompt: str, max_tokens: int = 1024):
    try:
        generation_config = genai.types.GenerationConfig(
            max_output_tokens=max_tokens
        )
        response = model.generate_content(prompt, generation_config=generation_config)
        return response.text
    except Exception as e:
        return f"Error consultando a Gemini: {str(e)}"
