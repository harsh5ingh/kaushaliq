"""Explicit CLI-only provider probe. Never an HTTP arbitrary-send endpoint."""
import argparse
import json
from src.config import settings
from src.accounts.providers import email_provider, ProviderUnavailable
from src.accounts.diagnostics import event
from src.routes.auth import EMAIL_PATTERN


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--recipient',required=True,help='An explicitly supplied inbox you control; never saved to application configuration.')
    parser.add_argument('--send',action='store_true',help='Send a non-OTP diagnostic email via the real adapter.')
    args=parser.parse_args()
    if settings.environment.lower()!='development': parser.exit(1,'Provider diagnostics are development-only.\n')
    if not EMAIL_PATTERN.fullmatch(args.recipient): parser.exit(1,'Supply a valid owned inbox.\n')
    try:
        adapter=email_provider()
        if not args.send:
            print(json.dumps({'configuration':'CONFIGURED','delivery':'NOT_TESTED'}));return
        result=adapter.send(args.recipient,'KaushalIQ email configuration check','This is an explicitly requested development delivery check. It contains no OTP and grants no account access.')
        event('email_configuration_probe',provider=settings.email_provider,recipient_domain=args.recipient.rsplit('@',1)[-1],status=result.status,error_code=result.error_code,provider_message_id=result.message_id)
        print(json.dumps({'status':result.status,'error_code':result.error_code,'provider_message_id':result.message_id,'inbox_delivery':'NOT_VERIFIED'}))
    except ProviderUnavailable as exc: print(json.dumps({'status':exc.result.status,'error_code':exc.result.error_code,'inbox_delivery':'NOT_VERIFIED'}))


if __name__=='__main__': main()
