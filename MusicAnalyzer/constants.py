from enum import Enum

DISTANT_HEARING = "distant"
INDIVIDUAL = "individual"


UPLOADED_FILE = 0
CORPUS_FILE = 1

STATE_SEARCH_CORPUS = "search_corpus"
STATE_UPLOAD_FILE = "upload"
STATE_SELECT_FOR_ANALYSIS = "select_for_analysis"


# Cookie names
CHOSEN_MUSIC_COOKIE = "chosen_music"
PARSED_FILE_COOKIE = "parsed_file"

# analysis


class ChordRepresentation(Enum):
    roman = 1
    chord_name = 2

class Analysis(Enum):
    chords = 1
    intervals = 2
    leading_notes = 3
    ambitus = 4
    key = 5
    pitches = 6


