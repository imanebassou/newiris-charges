import requests
import json

OLLAMA_URL = "http://host.docker.internal:11434/api/generate"
MODEL = "phi3:mini"


class BaseAgent:

    def __init__(self, name, description):
        self.name = name
        self.description = description

    def call_ollama(self, prompt, temperature=0.25, max_tokens=500):
        try:
            response = requests.post(OLLAMA_URL, json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": max_tokens,
                    "temperature": temperature,
                    "top_p": 0.9,
                    "num_ctx": 4096,   # increased from 2048
                    "repeat_penalty": 1.1,
                }
            }, timeout=180)
            return response.json().get('response', '').strip()
        except requests.exceptions.Timeout:
            return "Délai dépassé. Reformulez votre question ou réessayez."
        except requests.exceptions.ConnectionError:
            return "Ollama non disponible. Vérifiez qu'il est démarré sur le serveur."
        except Exception as e:
            return f"Erreur inattendue: {str(e)}"

    def call_ollama_json(self, prompt):
        response = self.call_ollama(prompt, temperature=0.1, max_tokens=200)
        try:
            response = response.strip()
            if '```json' in response:
                response = response.split('```json')[1].split('```')[0]
            elif '```' in response:
                response = response.split('```')[1].split('```')[0]
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end > start:
                response = response[start:end]
            return json.loads(response)
        except Exception:
            return {}

    def run(self, question, context=""):
        raise NotImplementedError("Chaque agent doit implémenter run()")