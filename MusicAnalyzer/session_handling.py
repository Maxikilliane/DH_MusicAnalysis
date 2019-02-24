from django.contrib.sessions.models import Session
from django.core import management


def on_session_start(request):
    # make sure that all expired sessions are cleaned out of db
    management.call_command('clearsessions')
    print("num active sessions: ")
    print(Session.objects.count())
    sessions = Session.objects.all()
    for session in sessions:
        print(session.session_key)
        print(session.expire_date)

    # 0 means that session is expired on browser closing
    s = request.session
    print("new session ")
    s.set_expiry(0)

