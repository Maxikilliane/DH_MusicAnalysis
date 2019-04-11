# explanations for choice
individual_choice_explanation = "You can analyze a single piece of music in different ways. \n" \
                                "First you need to either upload a file (in one of the valid formats) or choose a music piece from the corpus. \n" \
                                "By clicking the 'Analyze' Button the file gets rendered and you can choose which types of analysis you want to perform: Displaying chords, performing numeral analysis, showing the ambitus or the key of the music piece."

distant_choice_explanation =  "You can perform distant hearing, also referred to as digital musicology or statistical musicology. " \
                              "It transfers the principles of distant reading to music and uses quantitative methods to generate metrics from sheet music. " \
                              "Some of these metrics are the number of chords with a certain root or roman numeral or quality for each group, and similiar metrics generated about pitches, keys, ambitus, durations of notes and rests.\n " \
                              "First you need to either upload files (in one of the valid formats) or choose music pieces from the corpus or both in a combination.\n " \
                              "Next you can define groups, which will be compared and contrasted in the analysis. " \
                              "This can be everything that makes sense to you, for example comparing by composer (Mozart vs. Beethoven) or the the genre of music (symphony vs. folk songs) and so on. \n" \
                              "Before you click the ‚Analyze‘ button you should assign one of the predefined groups to each music piece and select the music pieces you want to use for the analysis."



# explanation for distant analysis
general_explanation = "Analysis results can viewed for different aspects of music, such as chords, pitches, key or ambitus. In many of the graphs, the predefined groups can be differed by the different colors. By clicking on the legend, a group can be disabled and enabled again, which makes it possible to focus on subgroups. Just hover over the charts to view more detailed information like the exact numbers."
chords_explanation = "Chords offers three different types of visualization, all displayed in a bar chart. There is the roman numeral chord count, which categorizes chords according to their function in roman numeral analysis, the chord root count, which shows the number of occurrences of each root and the chord quality count, which displays the number of occurrences of each quality of the underlying triad of a triad or seventh. The quality can either be major, minor, augmented or diminshed. In case a clear answer cannot be determined, the chord falls into the category 'other'."
pitches_explanation = "Pitches offer three different types of analysis results. The octave count shows how many pitches were in a certain octave, the pitch name count shows the number of occurrences for different pitches, and the pitch name count with octave combines the two and provides information on the number of occurrences of pitches of a certain name within a certain octave."
durations_explanation = "Duration analysis takes a look at the durations of notes and rests separately, and shows histograms for the name and number of the durations with the unit being quarter notes. Another chart treats notes and rests the same, and shows a histogram of durations of note and rest elements. Finally, the last chart juxtaposes the total durations of silence (rests) and sound (notes) in a group of music pieces."
key_explanation = "Key analysis routines are a variation of the algorithm developed by Carol Krumhansl and Mark A. Schmuckler called probe-tone key finding. The charts present the number of the times a key occured as the most probable one per group. Additional line charts show the four most probable keys identified for each music piece, together with their probabilities, in different graphs per group."
ambitus_explanation = "The ambitus is the range, or the distance between the highest and lowest note. It is visualised by two different visualizations. First, there is the range chart. The x-axis shows all the possible notes, while the y-axis isn’t used or needed and therefore doesn't have a value. The colored bar starts at the lowest pitch and ends at the highest pitch. The different colours stand for the different music pieces. Each group has it’s own diagram. The box plot shows the number of semitones, the maximum, medium and minimum as well as the upper (75%) and lower (25%) quartile."

distant_hearing_explanations = {"general": general_explanation,
                                "chords": chords_explanation,
                                "pitches": pitches_explanation,
                                "durations": durations_explanation,
                                "key": key_explanation,
                                "ambitus": ambitus_explanation
                                }

tooltip_json = "You can get the data generated by the analysis in JSON-format by clicking on the button. JSON (JavaScript Object Notation) is a lightweight data-interchange format. You can use this data to perform further analyses or generate more visualizations. Environments for statistical computing and graphics, such as Gnu R, often support importing data in JSON-format."
tooltip_file_formats = "Valid file formats are: <br> ABC (.abc), Capella (.cap), ClercqTemperley, Humdrum (.krn), MEI (.mei), Midi (.midi), MuseData (.md), MusicXML (.musicxml/.mxl), Noteworthy (.nwc), NoteworthyBinary, RomanText (.rtf), Scala (.scl), TinyNotation and Volpiano."
tooltip_corpus = "Click to explore contents of corpus"