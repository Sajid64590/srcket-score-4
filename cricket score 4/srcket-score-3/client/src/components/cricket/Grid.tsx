import "regenerator-runtime/runtime";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Mic } from "lucide-react";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import type { GridData } from "@shared/schema";

const PREDEFINED_BATSMEN = [
  "MS Dhoni", "RG Sharma", "AB de Villiers", "YK Pathan", 
  "Ch Gayle", "S Dhawan", "SK Raina", "KD Karthik",
  "MK Pandey", "DA Warner", "V Kohli", "AM Rahane",
  "V Sehwag", "G Gambhir", "RV Uthappa", "PA Patel",
  "BB McCullum"
];

const PREDEFINED_BOWLERS = [
  "Sandeep", "A Mishra", "A Nehra", "DW Steyn",
  "P Kumar", "B Kumar", "PP Chawla", "RV Kumar",
  "DJ Bravo", "SL Malinga", "UT Yadav", "DS Kulkarni",
  "JD Unadkat", "R Ashwin", "Sr Watson", "M Morkel",
  "MM Sharma"
];

interface GridProps {
  data: GridData;
  onChange: (data: GridData) => void;
}

export function Grid({ data, onChange }: GridProps) {
  const { transcript, resetTranscript, listening } = useSpeechRecognition();
  const [activeCell, setActiveCell] = useState<{ type: 'batsman' | 'bowler', index: number } | null>(null);

  const handleVoiceInput = async (type: 'batsman' | 'bowler', index: number) => {
    try {
      const nameList = type === 'batsman' ? PREDEFINED_BATSMEN : PREDEFINED_BOWLERS;
      const matchedName = nameList.find(name => 
        name.toLowerCase().includes(transcript.toLowerCase())
      );

      if (matchedName) {
        if (type === 'batsman') {
          updateBatsman(index, matchedName);
        } else {
          updateBowler(index, matchedName);
        }
        resetTranscript();
      }
    } catch (error) {
      console.error('Voice input error:', error);
    }
  };

  const startListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({ language: 'en-IN' });
  };

  const DISMISSAL_DATA = {
    "Sandeep": ["MS Dhoni", "RG Sharma", "AB de Villiers", "YK Pathan", "Ch Gayle", "S Dhawan", "SK Raina"],
    "A Mishra": ["RG Sharma", "KD Karthik", "MK Pandey", "SK Raina", "DA Warner", "S Dhawan", "V Kohli"],
    "A Nehra": ["AM Rahane", "KD Karthik", "RG Sharma", "V Sehwag", "G Gambhir", "Ch Gayle", "MS Dhoni"],
    "DW Steyn": ["BB McCullum", "AB de Villiers", "AM Rahane", "V Kohli", "RG Sharma"],
    "P Kumar": ["S Dhawan", "SK Raina", "KD Karthik", "Ch Gayle", "V Sehwag", "AB de Villiers", "DA Warner", "YK Pathan", "BB McCullum"],
    "B Kumar": ["AB de Villiers", "BB McCullum", "AM Rahane", "RG Sharma", "MK Pandey", "S Dhawan", "DA Warner", "KD Karthik", "Ch Gayle"],
    "PP Chawla": ["PA Patel", "DA Warner", "AM Rahane", "KD Karthik", "Ch Gayle", "YK Pathan", "V Kohli"],
    "RV Kumar": ["BB McCullum", "DA Warner", "KD Karthik", "G Gambhir", "RV Uthappa", "AM Rahane", "AB de Villiers", "RG Sharma"],
    "DJ Bravo": ["MK Pandey", "DA Warner", "KD Karthik", "S Dhawan", "PA Patel", "SK Raina", "MS Dhoni"],
    "SL Malinga": ["SK Raina", "YK Pathan", "V Kohli", "S Dhawan", "AB de Villiers", "PA Patel", "DA Warner", "V Sehwag"],
    "UT Yadav": ["PA Patel", "KD Karthik", "AB de Villiers", "G Gambhir", "RV Uthappa", "V Sehwag", "MS Dhoni", "YK Pathan", "Ch Gayle"],
    "DS Kulkarni": ["V Kohli", "SK Raina", "BB McCullum", "MK Pandey", "YK Pathan", "KD Karthik", "RG Sharma", "DA Warner", "V Sehwag"],
    "JD Unadkat": ["RV Uthappa", "SK Raina", "V Kohli", "V Sehwag", "AB de Villiers", "G Gambhir", "BB McCullum", "MK Pandey", "S Dhawan"],
    "R Ashwin": ["RV Uthappa", "SK Raina", "BB McCullum", "AB de Villiers", "AM Rahane", "G Gambhir", "DA Warner"],
    "Sr Watson": ["S Dhawan", "YK Pathan", "BB McCullum", "PA Patel", "RV Uthappa", "V Sehwag", "SK Raina"],
    "M Morkel": ["MS Dhoni", "G Gambhir", "SK Raina", "Ch Gayle", "RV Uthappa"],
    "MM Sharma": ["MS Dhoni", "KD Karthik", "RV Uthappa", "PA Patel", "V Kohli", "SK Raina", "RG Sharma", "MK Pandey", "V Sehwag", "AM Rahane", "DA Warner", "YK Pathan"]
  };

  const checkDismissals = (batsmen: string[], bowlers: string[]): string[][] => {
    const outcomes = Array(5).fill(null).map(() => Array(5).fill(""));
    while (batsmen.length < 5) batsmen.push("");
    while (bowlers.length < 5) bowlers.push("");

    batsmen.forEach((batsman, batsmanIdx) => {
      if (!batsman) return;

      bowlers.forEach((bowler, bowlerIdx) => {
        if (!bowler) return;

        const dismissalList = DISMISSAL_DATA[bowler] || [];
        const isOut = dismissalList.some(dismissed => 
          dismissed.startsWith(batsman) || batsman.startsWith(dismissed)
        );

        outcomes[batsmanIdx][bowlerIdx] = isOut ? "out" : "not out";
      });
    });

    return outcomes;
  };

  const updateBatsman = (index: number, value: string) => {
    const newBatsmen = [...data.batsmen];
    newBatsmen[index] = value;
    const newOutcomes = checkDismissals(newBatsmen, data.bowlers);
    onChange({ ...data, batsmen: newBatsmen, outcomes: newOutcomes });
  };

  const updateBowler = (index: number, value: string) => {
    const newBowlers = [...data.bowlers];
    newBowlers[index] = value;
    const newOutcomes = checkDismissals(data.batsmen, newBowlers);
    onChange({ ...data, bowlers: newBowlers, outcomes: newOutcomes });
  };

  const handleCellChange = (row: number, col: number, value: string) => {
    if (col === 0) {
      updateBatsman(row, value);
    } else {
      updateBowler(col -1, value);
    }
  };

  return (
    <div className="w-full max-w-[95vw] mx-auto border rounded-lg bg-white shadow-md">
      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/5 bg-gray-50 text-xs sm:text-sm">Batsman/Bowler</TableHead>
            {data.bowlers.map((bowler, i) => (
              <TableHead key={i} className="w-1/5 p-0.5 sm:p-1">
                <Dialog onOpenChange={() => setActiveCell({ type: 'bowler', index: i })}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full text-xs sm:text-sm px-1 py-0.5 h-auto"
                    >
                      {bowler || `B${i + 1}`}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <div className="space-y-4">
                      <Button 
                        onClick={startListening}
                        disabled={listening}
                        className="w-full"
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        {listening ? 'Listening...' : 'Start Speaking'}
                      </Button>
                      {transcript && (
                        <>
                          <Button 
                            onClick={() => handleVoiceInput('bowler', i)}
                            className="w-full"
                          >
                            Use: {transcript}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              const inputWithoutSpaces = transcript.toLowerCase().replace(/\s/g, '');
                              const firstThreeChars = inputWithoutSpaces.slice(0, 3);
                              const suggestions = PREDEFINED_BOWLERS.filter(name => {
                                const nameWithoutSpaces = name.replace(/\s/g, '').toLowerCase();
                                return nameWithoutSpaces.includes(firstThreeChars);
                              }).slice(0, 3);
                              if (suggestions.length > 0) {
                                updateBowler(i, suggestions[0]);
                              }
                            }}
                            className="w-full mt-2"
                          >
                            Suggestions: {
                              (() => {
                                const inputWithoutSpaces = transcript.toLowerCase().replace(/\s/g, '');
                                const firstThreeChars = inputWithoutSpaces.slice(0, 3);
                                const suggestions = PREDEFINED_BOWLERS.filter(name => {
                                  const nameWithoutSpaces = name.replace(/\s/g, '').toLowerCase();
                                  return nameWithoutSpaces.includes(firstThreeChars);
                                });

                                return suggestions.length > 0 
                                  ? suggestions.slice(0, 3).map((suggestion, index) => (
                                      <span 
                                        key={index} 
                                        className="text-blue-500 hover:underline cursor-pointer"
                                        onClick={() => {
                                          updateBowler(i, suggestion);
                                          setActiveCell(null);
                                        }}
                                      >
                                        {suggestion}
                                        {index < 2 ? ', ' : ''}
                                      </span>
                                    ))
                                  : 'No matches';
                              })()
                            }
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full">Select from List</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {PREDEFINED_BOWLERS.map((name, j) => (
                            <DropdownMenuItem 
                              key={j}
                              onClick={() => updateBowler(i, name)}
                            >
                              {name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </DialogContent>
                </Dialog>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.batsmen.map((batsman, i) => (
            <TableRow key={i}>
              <TableCell className="bg-gray-50 p-0.5 sm:p-1">
                <Dialog onOpenChange={() => setActiveCell({ type: 'batsman', index: i })}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full text-[10px] sm:text-xs px-0.5 py-0.5 h-auto"
                    >
                      {batsman || `Bat${i + 1}`}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <div className="space-y-4">
                      <Button 
                        onClick={startListening}
                        disabled={listening}
                        className="w-full"
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        {listening ? 'Listening...' : 'Start Speaking'}
                      </Button>
                      {transcript && (
                        <>
                          <Button 
                            onClick={() => handleVoiceInput('batsman', i)}
                            className="w-full"
                          >
                            Use: {transcript}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              const inputWithoutSpaces = transcript.toLowerCase().replace(/\s/g, '');
                              const firstThreeChars = inputWithoutSpaces.slice(0, 3);
                              const suggestions = PREDEFINED_BATSMEN.filter(name => {
                                const nameWithoutSpaces = name.replace(/\s/g, '').toLowerCase();
                                return nameWithoutSpaces.includes(firstThreeChars);
                              }).slice(0, 3);
                              if (suggestions.length > 0) {
                                updateBatsman(i, suggestions[0]);
                              }
                            }}
                            className="w-full mt-2"
                          >
                            Suggestions: {
                              (() => {
                                const inputWithoutSpaces = transcript.toLowerCase().replace(/\s/g, '');
                                const firstThreeChars = inputWithoutSpaces.slice(0, 3);
                                const suggestions = PREDEFINED_BATSMEN.filter(name => {
                                  const nameWithoutSpaces = name.replace(/\s/g, '').toLowerCase();
                                  return nameWithoutSpaces.includes(firstThreeChars);
                                });

                                return suggestions.length > 0 
                                  ? suggestions.slice(0, 3).map((suggestion, index) => (
                                      <span 
                                        key={index} 
                                        className="text-blue-500 hover:underline cursor-pointer"
                                        onClick={() => {
                                          updateBatsman(i, suggestion);
                                          setActiveCell(null);
                                        }}
                                      >
                                        {suggestion}
                                        {index < 2 ? ', ' : ''}
                                      </span>
                                    ))
                                  : 'No matches';
                              })()
                            }
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full">Select from List</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {PREDEFINED_BATSMEN.map((name, j) => (
                            <DropdownMenuItem 
                              key={j}
                              onClick={() => updateBatsman(i, name)}
                            >
                              {name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
              {data.outcomes[i]?.map((outcome, j) => (
                <TableCell key={j} className="text-center font-medium bg-green-50 p-4">
                  {outcome}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}