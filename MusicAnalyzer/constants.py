from enum import Enum

DISTANT_HEARING = "distant"
INDIVIDUAL = "individual"

UPLOADED_FILE = 0
CORPUS_FILE = 1

STATE_SEARCH_CORPUS = "search_corpus"
STATE_UPLOAD_FILE = "upload"
STATE_SELECT_FOR_ANALYSIS = "select_for_analysis"
STATE_ADD_NEW_GROUP = "new_group"


class State(Enum):
    search_corpus = "search_corpus"
    upload_file = "upload"
    select_for_analysis = "select_for_analysis"
    add_new_group = "new_group"
    distant_hearing = "get_distant_hearing_results"


class Prefix(Enum):
    individual_analysis = "analysis_choice"
    chord_representation = "chord_rep"
    add_group = "add_group"
    choose_group = "choose_group"
    choose_music_file = "choose_music_piece"


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
