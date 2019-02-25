from django.core import management

from MusicAnalyzer import constants


def on_session_start(request):
    # make sure that all expired sessions are cleaned out of db
    management.call_command('clearsessions')
    # 0 means that session is expired on browser closing
    s = request.session
    s.set_expiry(0)


# persists music choices for the duration of a session
def save_music_choice_to_cookie(request, music_pieces):
    request.session[constants.CHOSEN_MUSIC_COOKIE] = music_pieces


def access_music_choice_from_cookie(request):
    if request.session.get(constants.CHOSEN_MUSIC_COOKIE):
        print(request.session[constants.CHOSEN_MUSIC_COOKIE])
        return request.session[constants.CHOSEN_MUSIC_COOKIE]


def save_parsed_file_to_cookie(request, file):
    request.session[constants.PARSED_FILE_COOKIE] = file


def access_save_parsed_file_from_cookie(request):
    if request.session.get(constants.PARSED_FILE_COOKIE):
        print(request.session[constants.PARSED_FILE_COOKIE])
        return request.session[constants.PARSED_FILE_COOKIE]
