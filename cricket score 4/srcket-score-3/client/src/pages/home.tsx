import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Grid } from "@/components/cricket/Grid";
import { Camera } from "@/components/cricket/Camera";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { GridData, MatchData } from "@shared/schema";
import { createWorker } from 'tesseract.js';
import { Card, CardContent } from "@/components/ui/card";
import { Image } from "lucide-react";

export default function Home() {
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [gridData, setGridData] = useState<GridData>({
    batsmen: ["", "", "", ""],
    bowlers: ["", "", "", ""],
    outcomes: Array(4).fill(Array(4).fill("")),
  });

  const { toast } = useToast();

  const { data: matchData } = useQuery<MatchData[]>({ 
    queryKey: ["/api/match-data"]
  });

  const { mutate: clearData } = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/match-data");
    },
    onSuccess: () => {
      setGridData({
        batsmen: ["", "", "", ""],
        bowlers: ["", "", "", ""],
        outcomes: Array(4).fill(Array(4).fill("")),
      });
      setCapturedImage(null);
      toast({
        title: "Data cleared successfully",
      });
    },
  });

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData);
    setShowCamera(false);
    toast({
      title: "Image captured successfully",
      description: "Click 'Extract Text' to process the image"
    });
  };

  const handleExtract = async () => {
    if (!capturedImage) {
      toast({
        title: "No image captured",
        description: "Please capture an image first",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      toast({
        title: "Processing image...",
        description: "Please wait while we extract the text",
      });

      const worker = await createWorker();

      // Configure tesseract for better text recognition
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ',
        tessedit_pageseg_mode: 6,
      });

      const result = await worker.recognize(capturedImage);
      console.log('Extracted text:', result.data.text);

      const text = result.data.text;
      console.log('Extracted text:', text);

      // Try to extract text and populate in the grid
      const words = text.split(/\s+/).filter(word => word.length > 0);
      
      // Find matching names from predefined lists
      const matchingBowlers = words.filter(word => 
        PREDEFINED_BOWLERS.some(bowler => 
          bowler.toLowerCase().includes(word.toLowerCase()) || 
          word.toLowerCase().includes(bowler.toLowerCase())
        )
      ).map(word => 
        PREDEFINED_BOWLERS.find(bowler => 
          bowler.toLowerCase().includes(word.toLowerCase()) || 
          word.toLowerCase().includes(bowler.toLowerCase())
        )
      ).filter((bowler): bowler is string => bowler !== undefined);

      const matchingBatsmen = words.filter(word => 
        PREDEFINED_BATSMEN.some(batsman => 
          batsman.toLowerCase().includes(word.toLowerCase()) || 
          word.toLowerCase().includes(batsman.toLowerCase())
        )
      ).map(word => 
        PREDEFINED_BATSMEN.find(batsman => 
          batsman.toLowerCase().includes(word.toLowerCase()) || 
          word.toLowerCase().includes(batsman.toLowerCase())
        )
      ).filter((batsman): batsman is string => batsman !== undefined);

      // Take first 4 unique names for each
      const uniqueBowlers = [...new Set(matchingBowlers)].slice(0, 4);
      const uniqueBatsmen = [...new Set(matchingBatsmen)].slice(0, 4);

      setGridData(prev => ({
        ...prev,
        batsmen: uniqueBatsmen.length > 0 ? 
          [...uniqueBatsmen, ...prev.batsmen.slice(uniqueBatsmen.length)] : 
          prev.batsmen,
        bowlers: uniqueBowlers.length > 0 ? 
          [...uniqueBowlers, ...prev.bowlers.slice(uniqueBowlers.length)] : 
          prev.bowlers
      }));

      await worker.terminate();

      toast({
        title: "Text extracted successfully",
      });

    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: "Failed to extract text",
        description: "Please try again or enter data manually",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const dismissalData = {
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

const handleMatchData = () => {
  const newOutcomes = Array(4).fill(null).map(() => Array(4).fill(""));

  gridData.batsmen.forEach((batsman, batsmanIdx) => {
    if (!batsman) return;
    
    gridData.bowlers.forEach((bowler, bowlerIdx) => {
      if (!bowler) return;

      const dismissalList = dismissalData[bowler] || [];
      const isOut = dismissalList.some(dismissed => 
        dismissed.startsWith(batsman) || batsman.startsWith(dismissed)
      );
      
      if (batsmanIdx !== -1 && bowlerIdx !== -1) {
        newOutcomes[batsmanIdx][bowlerIdx] = isOut ? "out" : "not out";
      }
    });
  });

  setGridData(prev => ({
    ...prev,
    outcomes: newOutcomes
  }));
};

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Cricket Scoring App</h1>

        <div className="relative flex items-center justify-center min-h-[500px]">
          {showCamera ? (
            <Camera
              onCapture={handleCapture}
              onClose={() => setShowCamera(false)}
            />
          ) : (
            <div className="w-full space-y-6">
              {capturedImage && (
                <Card>
                  <CardContent className="p-4">
                    <img 
                      src={capturedImage} 
                      alt="Captured score"
                      className="w-full max-h-[200px] object-contain rounded-lg"
                    />
                  </CardContent>
                </Card>
              )}
              <Grid data={gridData} onChange={setGridData} />
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4">
          <Button 
            variant="outline"
            onClick={() => setShowCamera(true)}
            disabled={isProcessing}
          >
            <Image className="w-4 h-4 mr-2" />
            Scan
          </Button>
          {capturedImage && (
            <Button
              variant="outline"
              onClick={handleExtract}
              disabled={isProcessing}
            >
              Extract Text
            </Button>
          )}
          
          <Button 
            variant="destructive"
            onClick={() => clearData()}
            disabled={isProcessing}
          >
            Clear Data
          </Button>
        </div>
      </div>
    </div>
  );
}