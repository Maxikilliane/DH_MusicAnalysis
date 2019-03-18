import os
import re
from os.path import isfile, join
from pathlib import WindowsPath, PosixPath

import matplotlib.pyplot as plt
from django.http import JsonResponse
from django.shortcuts import render, redirect, render_to_response
from django.views import View
from music21.converter import ConverterFileException
from music21.musicxml import m21ToXml

from MusicAnalyzer import constants
from MusicAnalyzer.choice import upload_files, search_corpus, get_metadata_from_uploaded_files
from MusicAnalyzer.constants import ChordRepresentation, Prefix
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
        data = get_already_uploaded_files(request, constants.INDIVIDUAL)
        self.context_dict["data"] = data
        self.context_dict["explanation"] = "You can analyze a single piece of music in different ways. First you need to either upload a file (in one of the valid formats) or choose a music piece from the corpus. By clicking the 'Analyze' Button the file gets rendered and you can choose which types of analysis you want to perform: Displaying chords, intervals, showing the ambitus or the key of the music piece."
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
        data = get_already_uploaded_files(request, constants.DISTANT_HEARING)
        self.context_dict["data"] = data
        return render(request, self.template_name, self.context_dict)

    def post(self, request):
        return super(DistantHearingChoice, self).post(request, context=constants.DISTANT_HEARING)


class DistantAnalysis(View):

    def get(self, request):
        music_pieces = access_music_choice_from_cookie(
            request)  # make this instance variable and only change when updated
        for music_piece in music_pieces:
            # TODO analyse data for at least first tab here
            pass

        return render(request, "MusicAnalyzer/DistantAnalysis.html", {"music_pieces": music_pieces})


class IndividualAnalysis(View):
    context_dict = {}
    gex = m21ToXml.GeneralObjectExporter()

    def get(self, request):
        print("get")
        # parsed_file = access_save_parsed_file_from_cookie(request)
        # parsed_file = m21.converter.thaw(parsed_file)
        choice = access_music_choice_from_cookie(request)
        parsed_file = parse_file(choice.get("path", ""), choice.get("number", None), choice.get("file_source", None))
        analysis_form = IndividualAnalysisForm(prefix="analysis_choice")
        keys = get_key_possibilities(parsed_file)
        key_form = KeyForm(keys, prefix="key", initial={"key_choice": keys[0].tonicPitchNameWithCase})


        parsed_file = self.gex.parse(parsed_file).decode('utf-8')

        analysis_form = IndividualAnalysisForm(prefix=Prefix.individual_analysis.value)
        chords_form = ChordRepresentationForm(prefix=Prefix.chord_representation.value,
                                              initial={"chord_representation": ChordRepresentation.roman.value})
        self.context_dict.update(
            {"music_piece": parsed_file, "analysis_form": analysis_form, "chords_form": chords_form, "key_form": key_form})
        # return render(request, "MusicAnalyzer/Results.html", self.context_dict)
        return render(request, "MusicAnalyzer/IndividualAnalysis.html", self.context_dict)

    def post(self, request):
        print("post")
        if request.is_ajax():
            analysis_form = IndividualAnalysisForm(request.POST, prefix=Prefix.individual_analysis.value)
            if analysis_form.is_valid():
                choice = access_music_choice_from_cookie(request)
                parsed_file = parse_file(choice.get("path", ""), choice.get("number", None),
                                         choice.get("file_source", None))
                chosen = analysis_form.cleaned_data.get('individual_analysis', [])
                keys = get_key_possibilities(parsed_file)
                key_form = KeyForm(keys, request.POST, prefix="key")


                if Analysis.key.value in chosen:
                    print("analysing key")
                    if key_form.is_valid():
                        chosen_key = key_form.cleaned_data.get("key_choice", "")
                        key = m21.key.Key(chosen_key)
                    else:
                        key = keys[0]
                        self.context_dict["key_form_error_message"] = "Error during key choice, the default key, "+get_better_key_name(key) +", was used instead."



                if Analysis.chords.value in chosen:
                    print("analysing chords")

                    chords_form = ChordRepresentationForm(request.POST, prefix=Prefix.chord_representation.value)
                    if chords_form.is_valid():
                        chord_representation = chords_form.cleaned_data.get("chord_representation", -1)
                    else:
                        pass
                        # TODO error handling
                    chord_information = get_chord_information(parsed_file, key, chord_representation)
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
                    ambitus = get_ambitus_for_display(parsed_file, self.gex, self.context_dict)
                    print("ambitus")
                    self.context_dict["ambitus_display"] = ambitus
                else:
                    del self.context_dict["ambitus_display"]

                if Analysis.key.value in chosen:
                    print("analysing key")
                    self.context_dict["key_possibilities"] = keys

                parsed_file = self.gex.parse(parsed_file).decode('utf-8')

                self.context_dict['music_piece'] = parsed_file
                # print(self.context_dict)
                # return JsonResponse(self.context_dict)
                return render_to_response('MusicAnalyzer/Results.html', self.context_dict)
                # return JsonResponse({"result": "success"})
            else:
                print(analysis_form.errors)
        # return render(request, "MusicAnalyzer/IndividualAnalysis.html", self.context_dict)


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


def get_already_uploaded_files(request, context):
    path = os.path.join(settings.MEDIA_ROOT, request.session.session_key)
    file_names = [os.path.join(path, file) for file in os.listdir(path) if isfile(os.path.join(path, file))]

    data = {}
    results = []
    for path in file_names:
        try:
            result = get_metadata_from_uploaded_files(context, path, False)
            results.append(result)

        except ConverterFileException:
            data.update({"is_valid": False,
                         "error_message": "This file format cannot be parsed. Please try a different one."})
            os.remove(path)
        except ValueError:
            data.update({"is_valid": False,
                         "error_message": "Something went wrong with the file upload. Perhaps your file is broken."})
            os.remove(path)
    data["results"] = results
    data["context"] = context
    return data


def transform_music_source_to_dict(path, number, file_source):
    music_piece = {"path": path, "number": number, "file_source": file_source}
    return music_piece


def get_ambitus_for_display(stream, gex, context_dict):
    ambitus = get_ambitus(stream)
    display = m21.stream.Stream()
    display_part = m21.stream.Part()
    display_part.append(m21.note.Note(ambitus["pitches"][0]))
    display_part.append(m21.note.Note(ambitus["pitches"][1]))
    display.append(display_part)
    display.insert(0, m21.metadata.Metadata())
    # not necessary anymore because osmd provides the option to not display those, seemed cleaner that way.
    # display_part.partName = " "
    # display.metadata.title = ambitus["interval"].niceName
    # display.metadata.alternativeTitle = ""
    # display.metadata.movementName = str(ambitus["interval"].semitones) + " semitones"
    display.metadata.composer = " "
    context_dict["ambitus_interval"] = ambitus["interval"].niceName
    context_dict["semitones"] = str(ambitus["interval"].semitones) + " semitones"
    ambitus_display = gex.parse(display).decode("utf-8")
    return ambitus_display


def get_ambitus(stream):
    ambitus = m21.analysis.discrete.Ambitus(stream)
    pitch_span = ambitus.getPitchSpan(stream)
    interval = ambitus.getSolution(stream)

    return {"pitches": pitch_span, "interval": interval}


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
def get_chord_information(parsed_file, key, type_of_representation=constants.ChordRepresentation.roman):
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
        lyric_parts = get_chord_representation(chord, key, type_of_representation)
        for part in lyric_parts:
            chord.addLyric(part)

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
    chord_parts = []
    if representation_type == ChordRepresentation.chord_name.value:
        chord_figure = m21.harmony.chordSymbolFigureFromChord(chord, True)
        if chord_figure[0] == 'Chord Symbol Cannot Be Identified':
            symbol = chord.pitchedCommonName
        else:
            symbol = chord_figure[0]
        symbol_parts = re.split("-|\s", symbol)  # symbol.split()
        re.split("-|\s", symbol)
        for symbol_part in symbol_parts:
            chord_parts.append(symbol_part)
    elif representation_type == ChordRepresentation.roman.value:
        chord_parts.append(m21.roman.romanNumeralFromChord(chord, key).figure)

    return chord_parts


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
