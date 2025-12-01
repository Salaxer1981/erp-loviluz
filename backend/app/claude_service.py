import os
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

# Asegúrate de que tu .env tenga la clave nueva
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def ask_claude(prompt: str, max_tokens: int = 500):
    try:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929", # O el modelo que te funcionó: claude-sonnet-4-5...
            max_tokens=max_tokens,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return response.content[0].text
    except Exception as e:
        return f"Error consultando a Claude: {str(e)}"

