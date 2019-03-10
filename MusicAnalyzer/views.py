import os
from pathlib import WindowsPath, PosixPath

import matplotlib.pyplot as plt
from django.http import JsonResponse
from django.shortcuts import render, redirect, render_to_response
from django.views import View
from music21.musicxml import m21ToXml

from MusicAnalyzer import constants
from MusicAnalyzer.choice import upload_files, search_corpus
from MusicAnalyzer.constants import ChordRepresentation
from MusicAnalyzer.forms import *
import music21 as m21

from MusicAnalyzer.general import get_int_or_none
from MusicAnalyzer.session_handling import *

plt.ioff()  # turn off interactive matplotlib


class Index(View):
    template_name = "MusicAnalyzer/Index.html"

    def get(self, request):
        on_session_start(request)
        # information from the context dictionary can be referenced in the template
        return render(request, "MusicAnalyzer/Index.html")


class Choice(View):
    file_form_class = FileForm
    search_form_class = SearchForm
    template_name = "MusicAnalyzer/Choice.html"
    context_dict = {"heading": "Individual Analysis"}
    state = ""

    def get(self, request):
        on_session_start(request)
        self.context_dict["file_form"] = self.file_form_class()
        self.context_dict["search_form"] = self.search_form_class()

    # handle data getting back from view
    def post(self, request, context):
        self.state = request.POST.get("state", "")
        if self.state == constants.STATE_SEARCH_CORPUS:
            if request.is_ajax():
                return search_corpus(request, context)
        elif self.state == constants.STATE_SELECT_FOR_ANALYSIS:
            selecteds = request.POST.getlist("music_piece", None)
            if selecteds is not None:
                music_pieces_list = []
                for select in selecteds:
                    if select == "select all":
                        continue
                    else:
                        file_source = get_file_source(select)
                        parts = select.split(get_source_dependant_prefix(file_source))[1].split("__number__")
                        path = parts[0]
                        number = get_int_or_none(parts[1])
                        if context == constants.INDIVIDUAL:
                            save_music_choice_to_cookie(request,
                                                        transform_music_source_to_dict(path, number, file_source))
                            # can do this directly in for, because in individual analysis only one music piece is analysed
                            return redirect("MusicAnalyzer:individual_analysis")
                        elif context == constants.DISTANT_HEARING:
                            music_pieces_list.append(transform_music_source_to_dict(path, number, file_source))

                            # either: pass the data to the analysis view, analyze there
                            # or: analyse the data and pass the results to the analysis view
                            #       (probably takes longer to load on first time,
                            #        but doesn't require loading when switching tabs)

                if context == constants.DISTANT_HEARING:
                    save_music_choice_to_cookie(request, music_pieces_list)
                    return redirect("MusicAnalyzer:distant_analysis")

                # if context == constants.INDIVIDUAL:
                #   save_parsed_file_to_cookie(request, parsed_file)
                #  return redirect("MusicAnalyzer:individual_analysis")

        else:
            return upload_files(self, request, context)


class IndividualChoice(Choice):
    def get(self, request):
        super(IndividualChoice, self).get(request)
        self.context_dict["url"] = "MusicAnalyzer:individual_choice"
        self.context_dict["type"] = constants.INDIVIDUAL
        return render(request, self.template_name, self.context_dict)

    def post(self, request):
        return super(IndividualChoice, self).post(request, context=constants.INDIVIDUAL)


class DistantHearingChoice(Choice):
    file_form_class = MultipleFilesForm
    context_dict = {"heading": "Distant Hearing"}

    def get(self, request):
        super(DistantHearingChoice, self).get(request)
        self.context_dict["url"] = "MusicAnalyzer:distant_choice"
        self.context_dict["type"] = constants.DISTANT_HEARING
        return render(request, self.template_name, self.context_dict)

    def post(self, request):
        return super(DistantHearingChoice, self).post(request, context=constants.DISTANT_HEARING)


class DistantAnalysis(View):

    def get(self, request):
        music_pieces = access_music_choice_from_cookie(
            request)  # make this instance variable and only change when updated
        # TODO analyse data for at least first tab here
        return render(request, "MusicAnalyzer/DistantAnalysis.html", {"music_pieces": music_pieces})


class IndividualAnalysis(View):
    context_dict = {}

    def get(self, request):
        # parsed_file = access_save_parsed_file_from_cookie(request)
        # parsed_file = m21.converter.thaw(parsed_file)
        choice = access_music_choice_from_cookie(request)
        parsed_file = parse_file(choice.get("path", ""), choice.get("number", None), choice.get("file_source", None))
        print(parsed_file)
        gex = m21ToXml.GeneralObjectExporter()
        parsed_file = gex.parse(parsed_file).decode('utf-8')

        analysis_form = IndividualAnalysisForm(prefix="analysis_choice")
        self.context_dict.update({"music_piece": parsed_file, "analysis_form": analysis_form})
        #return render(request, "MusicAnalyzer/music_piece.html", self.context_dict)
        return render(request, "MusicAnalyzer/IndividualAnalysis.html", self.context_dict)

    def post(self, request):
        if request.is_ajax():
            analysis_form = IndividualAnalysisForm(request.POST, prefix="analysis_choice")
            if analysis_form.is_valid():
                choice = access_music_choice_from_cookie(request)
                parsed_file = parse_file(choice.get("path", ""), choice.get("number", None),
                                         choice.get("file_source", None))
                chosen = analysis_form.cleaned_data.get('individual_analysis', [])
                keys = get_key_possibilities(parsed_file)
                key = keys[0]

                if Analysis.chords.value in chosen:
                    print("analysing chords")
                    chord_information = get_chord_information(parsed_file, key)
                    chordified_file = chord_information["chords"]
                    parsed_file.insert(0, chordified_file)  # add chords to music
                    self.context_dict.update({"chord_names": chord_information["chord_name_count"],
                                              "chord_qualities": chord_information["chord_quality_count"],
                                              "chord_roots": chord_information["chord_root_count"]})

                if Analysis.intervals.value in chosen:
                    print("analysing intervals")

                if Analysis.leading_notes.value in chosen:
                    print("analysing leading notes")

                if Analysis.ambitus.value in chosen:
                    print("analysing ambitus")

                if Analysis.key.value in chosen:
                    print("analysing key")
                    self.context_dict["key_possibilities"]= keys

                gex = m21ToXml.GeneralObjectExporter()
                parsed_file = gex.parse(parsed_file).decode('utf-8')
                self.context_dict['music_piece'] = parsed_file
                print("test")
                print(self.context_dict)
                return render_to_response('MusicAnalyzer\music_piece.html', self.context_dict)
                #return JsonResponse({"result": "success"})

        # TODO: get info from form (transmitted via AJAX) which chord representation is wanted

                #return render(request, "MusicAnalyzer/IndividualAnalysis.html", self.context_dict)


# was necessary due to bug before rebuild of core corpus under windows
def get_corpus():
    if os.name == "nt":
        return m21.corpus.corpora.CoreCorpus()
    else:
        return m21.corpus.corpora.CoreCorpus()


def get_system_dependant_path(path):
    if os.name == "nt":
        return WindowsPath(path)
    else:
        return PosixPath(path)


# params:
# file_source_constant to distinguish uploaded files from corpus files
# sourcePath and number attributes of MetadataEntry-object, or path to uploaded file
# returns a Music21object
def parse_file(source_path, number, file_source):
    if file_source == constants.CORPUS_FILE:
        if source_path is not None and number is not None:
            test = m21.corpus.parse(get_system_dependant_path(source_path), number)
            # test = m21.converter.freeze(test)
            return test
        elif source_path is not None:
            test = m21.corpus.parse(get_system_dependant_path(source_path))
            # test = m21.converter.freeze(test)
            return test
        else:
            return None
    elif file_source == constants.UPLOADED_FILE:
        if source_path is not None:
            test = m21.converter.parse(get_system_dependant_path(source_path))
            # test = m21.converter.freeze(test)
            return test
        else:
            return None


def get_file_source(source_path):
    if source_path.startswith("path_upload__"):
        return constants.UPLOADED_FILE
    elif source_path.startswith("path_search__"):
        return constants.CORPUS_FILE
    else:
        return None


def get_source_dependant_prefix(source):
    if source == constants.UPLOADED_FILE:
        return "path_upload__"
    elif source == constants.CORPUS_FILE:
        return "path_search__"
    else:
        return "path__"


def transform_music_source_to_dict(path, number, file_source):
    music_piece = {"path": path, "number": number, "file_source": file_source}
    return music_piece


def get_interval_between_highest_and_lowest_pitch(stream):
    return stream.analyze('ambitus')


# get chords and summary stats on chords from parsed file
# params:
# * a parsed file (music21 Stream object)
# * which type of chord representation was requested by the user (roman or chord names)
# * key of the music_piece
# returns: a dictionary containing:
# * a stream object of the chordified file
# * 3 dictionaries containing summary stats on the number of chords with a certain name, root or chord quality
# additional info:
# name is the pitched common name of a chord
# root is the basis upon which a chord builds up
# chord quality is something like minor, major, diminished etc.
def get_chord_information(parsed_file, key, type_of_representation=constants.ChordRepresentation.chord_name):
    chords = parsed_file.chordify()
    chords_names = {}
    chords_qualities = {}
    chords_roots = {}

    for chord in chords.recurse().getElementsByClass('Chord'):
        root = chord.root()
        if chord.quality in chords_qualities:
            chords_qualities[chord.quality] += 1
        else:
            chords_qualities[chord.quality] = 1

        if chord.pitchedCommonName in chords_names:
            chords_names[chord.pitchedCommonName] += 1
        else:
            chords_names[chord.pitchedCommonName] = 1
        chord.addLyric(get_chord_representation(chord, key, type_of_representation))

        if root in chords_roots:
            chords_roots[root] += 1
        else:
            chords_roots[root] = 1

    return {"chords": chords,
            "chord_name_count": chords_names,
            "chord_quality_count": chords_qualities,
            "chord_root_count": chords_roots}


# get a chord symbol to display above the music
# ideally this is something like Am, C7 or similiar
# if chord symbol cannot be identified, get a more verbose name
def get_chord_representation(chord, key, representation_type):
    if representation_type == ChordRepresentation.chord_name:
        chord_figure = m21.harmony.chordSymbolFigureFromChord(chord, True)
        if chord_figure[0] == 'Chord Symbol Cannot Be Identified':
            return chord.pitchedCommonName
        else:
            return chord_figure[0]
    elif representation_type == ChordRepresentation.roman:
        return m21.roman.romanNumeralFromChord(chord, key).figure


# saves a plot object to disk (to allow for it to be passed to the frontend)
# TODO: need to decide on naming scheme for plots and adjust path accordingly
def save_plot_to_disk(request, plot):
    plot.doneAction = None
    plot.run()
    path = os.path.join(settings.MEDIA_ROOT, request.session.session_key, "graphs", "test.png")
    plot.figure.savefig(path)
    return path


# analyses the parsed music files to determine the key, gets the four most likely keys for a music piece
# get the "probability" for each key in the list by using key.correlationCoefficient
def get_key_possibilities(parsed_file):
    key = parsed_file.analyze('key')
    key_list = [key, key.alternateInterpretations[0], key.alternateInterpretations[1], key.alternateInterpretations[2]]
    return key_list
