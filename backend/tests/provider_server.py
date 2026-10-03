"""Only browser-test launcher. Never imported by src.main or selectable through env."""
import os
import re
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from src.main import app
from src.accounts import verification
from src.accounts.providers import ProviderResult
from src.routes import accounts
from src.config import settings
from fastapi import HTTPException
import uvicorn

if settings.environment.lower() == 'production': raise RuntimeError('Test delivery forbidden in production')
mailbox = {}


class CapturingEmail:
    def send(self,target,subject,text):
        codes=re.findall(r'\b\d{6}\b',text)
        if codes: mailbox[target]=codes[0]
        return ProviderResult('accepted')


verification.email_provider=lambda:CapturingEmail()
accounts.email_provider=lambda:CapturingEmail()


@app.get('/__test/otp')
def test_otp(target:str):
    if target not in mailbox: raise HTTPException(404)
    return {'code':mailbox[target]}


if __name__=='__main__':
    uvicorn.run(app,host='127.0.0.1',port=int(sys.argv[1]),log_level='error',access_log=False)
