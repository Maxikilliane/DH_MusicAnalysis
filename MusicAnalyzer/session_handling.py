from django.core import management


def on_session_start(request):
    # make sure that all expired sessions are cleaned out of db
    management.call_command('clearsessions')
    # 0 means that session is expired on browser closing
    s = request.session
    s.set_expiry(0)
