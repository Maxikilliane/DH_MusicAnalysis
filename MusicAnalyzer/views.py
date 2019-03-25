import os
import re
import statistics
import random
import string
from os.path import isfile, join
from pathlib import WindowsPath, PosixPath
import collections
import matplotlib.pyplot as plt
import json
from django.forms import formset_factory
from django.http import JsonResponse
from django.shortcuts import render, redirect, render_to_response
from django.views import View
# from matplotlib import collections
from music21.converter import ConverterFileException
from music21.musicxml import m21ToXml

from MusicAnalyzer import constants, texts
from MusicAnalyzer.choice import upload_files, search_corpus, get_metadata_from_uploaded_files, add_group, \
    get_available_groups, get_relevant_metadata
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
    group_form_class = AddGroupForm
    template_name = "MusicAnalyzer/Choice.html"
    context_dict = {"heading": "Individual Analysis"}
    state = ""
    group_names = []
    musicChoiceFormset = formset_factory(MusicChoiceForm, extra=0, can_delete=True)

    def get(self, request):
        on_session_start(request)
        self.context_dict["file_form"] = self.file_form_class()
        self.context_dict["search_form"] = self.search_form_class()
        self.context_dict["add_group_form"] = AddGroupForm(prefix=Prefix.add_group.value)
        self.context_dict["music_choice_form"] = self.musicChoiceFormset(
            form_kwargs={'session_key': request.session.session_key}, prefix=Prefix.choose_music_file.value)

        # MusicChoiceForm(prefix=Prefix.choose_music_file.value, session_key=request.session.session_key)

    # handle data getting back from view
    def post(self, request, context):
        self.state = request.POST.get("state", "")
        if self.state == constants.STATE_SEARCH_CORPUS:
            if request.is_ajax():
                return search_corpus(request, context)
        elif self.state == constants.State.select_for_analysis.value:
            print("Post")
            print(request.POST)
            music_choice_forms = self.musicChoiceFormset(request.POST,
                                                         form_kwargs={'session_key': request.session.session_key},
                                                         prefix=Prefix.choose_music_file.value)
            if music_choice_forms.is_valid():

                music_pieces_list = []
                for music_choice_form in music_choice_forms:
                    if music_choice_form.is_valid:

                        data = music_choice_form.cleaned_data
                        is_selected = data.get("is_selected", False)

                        if is_selected:
                            file_source = data.get("file_source")
                            path = data.get("path_to_source")
                            number = data.get("number")
                            group_choice = data.get("group_choice")
                            print(group_choice)
                            if context == constants.INDIVIDUAL:
                                print("individual")
                                save_music_choice_to_cookie(request,
                                                            transform_music_source_to_dict(path, number, file_source))
                                # can do this directly in for, because in individual analysis only one music piece is analysed
                                return redirect("MusicAnalyzer:individual_analysis")
                            elif context == constants.DISTANT_HEARING:
                                print("distant")
                                music_pieces_list.append(
                                    transform_music_source_to_dict(path, number, file_source, group_choice))
                    else:
                        print("non valid form")
                        # TODO error handling
                if context == constants.DISTANT_HEARING:
                    save_music_choice_to_cookie(request, music_pieces_list)
                    return redirect("MusicAnalyzer:distant_analysis")
            else:
                print(music_choice_forms.errors)

        elif self.state == constants.State.add_new_group.value:
            print("add_new_group")
            if request.is_ajax():
                print("ajax")
                return add_group(request, context)
        else:
            return upload_files(self, request, context)


class IndividualChoice(Choice):
    def get(self, request):
        super(IndividualChoice, self).get(request)
        self.context_dict["url"] = "MusicAnalyzer:individual_choice"
        self.context_dict["type"] = constants.INDIVIDUAL
        data = get_already_uploaded_files(request, constants.INDIVIDUAL)
        self.context_dict["data"] = data
        self.context_dict[
            "explanation"] = "You can analyze a single piece of music in different ways. First you need to either upload a file (in one of the valid formats) or choose a music piece from the corpus. By clicking the 'Analyze' Button the file gets rendered and you can choose which types of analysis you want to perform: Displaying chords, intervals, showing the ambitus or the key of the music piece."
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
        self.context_dict["explanation"] = "You can perform distant hearing, also referred to as digital musicology or (TODO ANNI: gabs da nicht noch nen anderen fancy namen für, der auch oft benutzt wird?). It transfers the principles of distant reading to music. First you need to either upload a file (in one of the valid formats) or choose a music piece from the corpus. Then you have to define the groups by which you want to perform the analysis. This can be everything, that makes sense to you, e.g. the componist (Mozart or Beethoven) or the the type of music (symphony or folk songs) and so on. Before you click the ‚Analyse‘ button you should assign one of the predefined group to each music piece and check the ones you want to use for the anylsis."
        self.context_dict["groups"] = get_available_groups(request)
        return render(request, self.template_name, self.context_dict)

    def post(self, request):
        return super(DistantHearingChoice, self).post(request, context=constants.DISTANT_HEARING)


class DistantAnalysis(View):

    def get(self, request):
        context_dict = {"explanations": texts.distant_hearing_explanations}
        music_pieces = access_music_choice_from_cookie(request)
        overall_results = {}  # all the results

        stats = get_summary_stats_for_individual_pieces(music_pieces)
        per_piece_results_list = stats["per_piece"]
        relevant_groups = stats["groups"]
        counter_dict = getCounters(relevant_groups)
        counter_dict = get_group_and_total_counts(per_piece_results_list, counter_dict)
        summary_stats = get_group_and_overall_summary_stats(counter_dict)

        overall_results["per_piece_stats"] = per_piece_results_list
        overall_results["per_group_stats"] = summary_stats["group_sum_stats"]  # per_group_results_list
        overall_results["total_sum_stats"] = summary_stats["total_sum_stats"]

        context_dict["metadata"] = stats["metadata"]
        context_dict["all_summary_stats"] = json.dumps(overall_results)

        return render(request, "MusicAnalyzer/DistantAnalysis.html", context_dict)


def get_results_from_counters(dictionary, accessor):
    result = {}
    result_key = accessor[:-2]
    result[result_key] = dictionary[accessor]
    return result


def get_summary_stats_for_individual_pieces(music_pieces):
    per_piece_results_list = []
    relevant_groups = set()
    metadata_list = []
    for music_piece in music_pieces:
        # metadata stuff
        analysis_result_for_this_piece = {}
        parsed_file = parse_file(music_piece.get("path", ""), music_piece.get("number", None),
                                 music_piece.get("file_source", None))
        metadata_dict = get_relevant_metadata(parsed_file)
        group_id = music_piece.get("group", None)
        if group_id is not None:
            group = DistantHearingGroup.objects.get(group_id=group_id)
            metadata_dict["group"] = group.name
            group_name = group.name
        else:
            metadata_dict["group"] = ""
            group_name = ""
        relevant_groups.add(group_name)
        metadata_list.append(metadata_dict)

        # analysis stuff
        key = get_key_possibilities(parsed_file)[0]
        chords_info = get_chord_information(parsed_file, key)
        chords_info.pop("chords",
                        None)  # chords are not json serializable and only in this dict, because the individual analysis method was reused
        ambitus_info = get_ambitus_for_distant_hearing(parsed_file)
        # pass stuff to results
        analysis_result_for_this_piece.update(metadata_dict)
        analysis_result_for_this_piece.update(chords_info)
        analysis_result_for_this_piece.update(ambitus_info)
        print(analysis_result_for_this_piece)
        per_piece_results_list.append(analysis_result_for_this_piece)
    return {"groups": relevant_groups, "metadata": metadata_list, "per_piece": per_piece_results_list}


def getCounters(relevant_groups):
    counter_dict = {}
    for group in relevant_groups:
        counter_dict[group] = get_dict_of_all_necessary_counters()
    counter_dict["total"] = get_dict_of_all_necessary_counters()
    return counter_dict


# sum the values with same keys
def get_group_and_total_counts(per_piece_results_list, counter_dict):
    for d in per_piece_results_list:

        group = d.get("group", "")
        print(counter_dict[group])
        counter_dict[group]["semitones_list"].append(d["num_semitones"])
        counter_dict[group]["lowest_pitch_counter"].update(d["lowest_pitch_count"])
        counter_dict[group]["highest_pitch_counter"].update(d["highest_pitch_count"])
        counter_dict[group]["chord_quality_counter"].update(d["chord_quality_count"])
        counter_dict[group]["chord_name_counter"].update(d["chord_name_count"])
        counter_dict[group]["chord_root_counter"].update(d["chord_root_count"])

        counter_dict["total"]["semitones_list"].append(d["num_semitones"])
        counter_dict["total"]["lowest_pitch_counter"].update(d["lowest_pitch_count"])
        counter_dict["total"]["highest_pitch_counter"].update(d["highest_pitch_count"])
        counter_dict["total"]["chord_quality_counter"].update(d["chord_quality_count"])
        counter_dict["total"]["chord_name_counter"].update(d["chord_name_count"])
        counter_dict["total"]["chord_root_counter"].update(d["chord_root_count"])
    return counter_dict


def get_group_and_overall_summary_stats(counter_dict):
    per_group_results_list = []
    total = {}
    print(counter_dict)
    for group, results_dict in counter_dict.items():
        group_results = {}
        for counter_name in results_dict.keys():
            if group == "total":
                total_sum_stats = get_results_from_counters(results_dict, counter_name)
                total.update(total_sum_stats)
            else:
                group_sum_stats = get_results_from_counters(results_dict, counter_name)
                group_results.update(group_sum_stats)

        if group != "total":
            group_results.update({"group_name": group})

            semitones_sum_stats = get_additional_semitones_sum_stats(group_results)
            group_results.update(semitones_sum_stats)

            per_group_results_list.append(group_results)
        else:
            semitones_sum_stats = get_additional_semitones_sum_stats(total)
            total.update(semitones_sum_stats)
    return {"total_sum_stats": total, "group_sum_stats": per_group_results_list}


def get_additional_semitones_sum_stats(results):
    semitones_list = results.get("semitones_li", None)
    if semitones_list is not None:
        mean = statistics.mean(semitones_list)
        median = statistics.median(semitones_list)
        minimum = min(semitones_list)
        maximum = max(semitones_list)
        return {"mean_ambitus_semitones": mean, "median_ambitus_semitones": median, "max_ambitus_semitones": maximum, "min_ambitus_semitones": minimum}
    else:
        return{}


class IndividualAnalysis(View):
    context_dict = {}
    gex = m21ToXml.GeneralObjectExporter()

    def get(self, request):
        print("get")
        # parsed_file = access_save_parsed_file_from_cookie(request)
        # parsed_file = m21.converter.thaw(parsed_file)
        choice = access_music_choice_from_cookie(request)
        print(choice)
        parsed_file = parse_file(choice.get("path", ""), choice.get("number", None), choice.get("file_source", None))
        keys = get_key_possibilities(parsed_file)
        key_form = KeyForm(keys, prefix="key", initial={"key_choice": keys[0].tonicPitchNameWithCase})

        parsed_file = self.gex.parse(parsed_file).decode('utf-8')

        analysis_form = IndividualAnalysisForm(prefix=Prefix.individual_analysis.value)
        chords_form = ChordRepresentationForm(prefix=Prefix.chord_representation.value,
                                              initial={"chord_representation": ChordRepresentation.roman.value})
        self.context_dict.update(
            {"music_piece": parsed_file, "analysis_form": analysis_form, "chords_form": chords_form,
             "key_form": key_form})
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
                key = keys[0]
                key_form = KeyForm(keys, request.POST, prefix="key")

                if Analysis.key.value in chosen:
                    print("analysing key")
                    if key_form.is_valid():
                        chosen_key = key_form.cleaned_data.get("key_choice", "")
                        key = m21.key.Key(chosen_key)
                    else:
                        key = keys[0]
                        self.context_dict[
                            "key_form_error_message"] = "Error during key choice, the default key, " + get_better_key_name(
                            key) + ", was used instead."

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
                    if 'ambitus_display' in self.context_dict.keys():
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
    if file_source == "search":
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
    elif file_source == "upload":
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


def transform_music_source_to_dict(path, number, file_source, group=None):
    if group is not None:
        group_id = group.pk
    else:
        group_id = None
    music_piece = {"path": path, "number": number, "file_source": file_source, "group": group_id}
    return music_piece


def get_ambitus_for_distant_hearing(stream):
    ambitus = get_ambitus(stream)
    return {"lowest_pitch_count": {ambitus["pitches"][0].nameWithOctave: 1},
            "highest_pitch_count": {ambitus["pitches"][1].nameWithOctave: 1}, "num_semitones": ambitus["interval"].semitones}


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
        if root.name in chords_roots:
            chords_roots[root.name] += 1
        else:
            chords_roots[root.name] = 1

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


def get_dict_of_all_necessary_counters():
    return {
        "semitones_list":[],
        "lowest_pitch_counter": collections.Counter(),
        "highest_pitch_counter": collections.Counter(),
        "chord_quality_counter": collections.Counter(),
        "chord_name_counter": collections.Counter(),
        "chord_root_counter": collections.Counter()
    }
