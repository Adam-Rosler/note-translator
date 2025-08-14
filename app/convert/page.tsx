"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface Note {
  title: string;
  content: string;
}

type AppState = 'upload' | 'processing' | 'results' | 'complete';

export default function ConvertPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [transcribedNotes, setTranscribedNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);
  const [appState, setAppState] = useState<AppState>('upload');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [individualCopyFeedback, setIndividualCopyFeedback] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...imageFiles]);
      setError("");
    } else {
      setError("Please select image files");
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...imageFiles]);
      setError("");
    } else {
      setError("Please drop image files");
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleTranscribe = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one image file");
      return;
    }

    setAppState('processing');
    setIsLoading(true);
    setError("");
    setTranscribedNotes([]);
    
    try {
      const formData = new FormData();
      
      // Add all images to the form data
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      const res = await fetch('/api/img-to-text', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error('Failed to process images');
      
      const data = await res.json();
      if (data.notes && Array.isArray(data.notes)) {
        setTranscribedNotes(data.notes);
        setAppState('results');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError("Failed to transcribe images. Please try again.");
      setAppState('upload');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const allText = transcribedNotes.map(note => `${note.title}\n${note.content}`).join('\n\n---\n\n');
      await navigator.clipboard.writeText(allText);
      setShowCopiedFeedback(true);
      setTimeout(() => setShowCopiedFeedback(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const handleCopyIndividualNote = async (note: Note, index: number) => {
    try {
      const noteText = `${note.title}\n${note.content}`;
      await navigator.clipboard.writeText(noteText);
      setIndividualCopyFeedback(index);
      setTimeout(() => setIndividualCopyFeedback(null), 2000);
    } catch (err) {
      console.error("Failed to copy note to clipboard:", err);
    }
  };

  const handleStartOver = () => {
    setSelectedFiles([]);
    setTranscribedNotes([]);
    setError("");
    setAppState('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const renderUploadScreen = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
          <svg className="w-10 h-10 text-blue-600" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-4xl font-light text-slate-800">Note Translator</h1>
        <p className="text-lg text-slate-600 max-w-md mx-auto">Upload your handwritten notes and let AI convert them to digital text</p>
        
        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInfoModal(true)}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 px-4 py-2 rounded-xl transition-all duration-200 text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Why This App Exists
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-500 ${
              selectedFiles.length > 0
                ? "border-emerald-200 bg-emerald-50/50 scale-105"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/30"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {selectedFiles.length > 0 ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3 text-emerald-700">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shadow-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="font-medium text-xl">{selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} ready</span>
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto space-y-3">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white/90 rounded-xl px-4 py-3 text-sm border border-slate-100 shadow-sm">
                        <span className="text-slate-700 truncate max-w-xs">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-slate-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 p-0 rounded-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-4 justify-center">
                    <Button 
                      onClick={handleTranscribe}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-3 rounded-xl text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      Convert Notes
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 px-6 py-2 rounded-xl transition-all duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add More Images
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-600 text-lg">
                    <span 
                      className="font-medium text-slate-800 hover:text-slate-600 cursor-pointer underline decoration-slate-300 underline-offset-4" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Click to upload
                    </span>{" "}
                    or drag and drop images here
                  </p>
                  <p className="text-sm text-slate-400 mt-2">PNG, JPG, JPEG up to 10MB each</p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {error && (
            <div className="mt-6 p-4 bg-red-50/80 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderProcessingScreen = () => (
    <div className="space-y-8 text-center">
      <div className="space-y-6">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h1 className="text-4xl font-light text-slate-800">Processing Your Notes</h1>
        <p className="text-lg text-slate-600 max-w-md mx-auto">Our AI is carefully transcribing your handwritten notes. This may take a few moments...</p>
      </div>

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardContent className="p-12">
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-3 text-slate-600">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-medium">Processing {selectedFiles.length} image{selectedFiles.length > 1 ? 's' : ''}</span>
            </div>
            
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderResultsScreen = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
          <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-light text-slate-800">Notes Converted!</h1>
        <p className="text-lg text-slate-600">Your handwritten notes have been successfully transcribed</p>
      </div>

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-medium text-slate-700">Transcribed Notes</CardTitle>
              <CardDescription className="text-slate-500 text-lg">
                {transcribedNotes.length} note{transcribedNotes.length > 1 ? 's' : ''} converted successfully
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {showCopiedFeedback && (
                <span className="text-sm text-emerald-600 font-medium bg-emerald-50 px-3 py-1 rounded-full">Copied!</span>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyToClipboard}
                className="border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {transcribedNotes.map((note, index) => (
            <div key={index} className="border border-slate-100 rounded-2xl p-6 bg-white/50 shadow-sm">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-slate-800">{note.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      {selectedFiles[index]?.name || 'Unknown file'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyIndividualNote(note, index)}
                      className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 h-8 px-3 rounded-lg text-xs"
                    >
                      {individualCopyFeedback === index ? (
                        <span className="text-emerald-600 font-medium">Copied!</span>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <Textarea
                value={note.content}
                onChange={(e) => {
                  const updatedNotes = [...transcribedNotes];
                  updatedNotes[index] = { ...note, content: e.target.value };
                  setTranscribedNotes(updatedNotes);
                }}
                placeholder="Note content..."
                className="min-h-[120px] font-mono text-sm bg-white/80 border-slate-200 focus:border-slate-300 focus:ring-slate-200 rounded-xl"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="text-center">
        <Button 
          onClick={handleStartOver}
          className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-10 py-3 rounded-xl text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          Start Over
        </Button>
      </div>
    </div>
  );

  const renderInfoModal = () => (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${showInfoModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto transform transition-transform duration-300 scale-100">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-medium text-slate-800">Why This App Exists</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfoModal(false)}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 h-8 w-8 p-0 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
          
          <div className="space-y-4 text-slate-600">
            <p className="text-lg leading-relaxed">
              Hey :P, I made this app because I like to take notes in a handwritten style.
              But I also sometimes find it hard to read my own handwriting, and keeping track of my notes.
              Using this I can upload it to something like obsidian or a google doc.
              I think getting your thoughts down on paper (or any form of writing) is the best way to get your ideas and thoughts out there.
              Enjoy!
            </p>

          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-200">
            <Button
              onClick={() => setShowInfoModal(false)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Got it, thanks!
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="transition-all duration-700 ease-in-out">
          {appState === 'upload' && renderUploadScreen()}
          {appState === 'processing' && renderProcessingScreen()}
          {appState === 'results' && renderResultsScreen()}
        </div>
      </div>
      
      {renderInfoModal()}
    </div>
  );
}