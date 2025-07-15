"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Navigation from "@/components/Navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Button from "@/components/Button";
import TextArea from "@/components/TextArea";
import Select from "@/components/Select";
import ImageUpload from "@/components/ImageUpload";
import Image from "next/image";

// Image models available in OpenAI
const IMAGE_MODELS = [
  { value: "dall-e-3", label: "DALL-E 3 - Most advanced image generation model" },
  { value: "dall-e-2", label: "DALL-E 2 - Previous generation image model" }
];

// Image size options
const SIZE_OPTIONS = [
  { value: "256x256", label: "Small (256x256)" },
  { value: "512x512", label: "Medium (512x512)" },
  { value: "1024x1024", label: "Large (1024x1024)" },
  { value: "1792x1024", label: "Landscape (1792x1024)" },
  { value: "1024x1792", label: "Portrait (1024x1792)" }
];

// Image quality options
const QUALITY_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "hd", label: "HD" }
];

export default function ImageGeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("dall-e-3");
  const [size, setSize] = useState("1024x1024");
  const [quality, setQuality] = useState("standard");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [revisedPrompt, setRevisedPrompt] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pasteEnabled, setPasteEnabled] = useState(true);
  
  // Authentication is handled by ProtectedRoute component
  useAuth(); // Keep the hook to ensure auth context is used

  // Function to analyze uploaded image using OpenAI's vision capabilities
  const handleAnalyzeImage = async () => {
    if (!uploadedImage) {
      setError("No image to analyze");
      return;
    }
    
    setIsAnalyzing(true);
    setError("");
    
    try {
      const response = await fetch("/api/image-generator/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: uploadedImage
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze image");
      }
      
      setImageAnalysis(data.analysis);
      // Don't automatically set the prompt to the analysis
      // This allows users to write their own instructions
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("Image analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Effect to clear image analysis when uploaded image changes
  useEffect(() => {
    if (!uploadedImage) {
      setImageAnalysis(null);
    }
  }, [uploadedImage]);
  
  // Global paste handler for the entire form
  const handleGlobalPaste = (e: React.ClipboardEvent) => {
    if (isLoading || isAnalyzing || !pasteEnabled) return;
    
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (!file) continue;
        
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageData = event.target?.result as string;
          setUploadedImage(imageData);
          // Show a temporary notification
          setError("Image pasted! ✓");
          setTimeout(() => setError(""), 1500);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };
  
  // Enable/disable paste handling when the textarea is focused
  const handleTextAreaFocus = () => setPasteEnabled(false);
  const handleTextAreaBlur = () => setPasteEnabled(true);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }
    
    setIsLoading(true);
    setError("");
    setGeneratedImage(null);
    setRevisedPrompt(null);
    
    try {
      const response = await fetch("/api/image-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          model,
          size,
          quality,
          referenceImage: uploadedImage // Include the reference image if available
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }
      
      setGeneratedImage(data.url);
      setRevisedPrompt(data.revised_prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("Image generation error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Navigation activeItem="image-generator" />
        
        <div className="container mx-auto p-4 flex-grow">
          <h1 className="text-2xl font-bold mb-4">AI Image Generator</h1>
          
          <div 
            className="bg-white shadow-md rounded-lg p-6 mb-6"
            onPaste={handleGlobalPaste}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Reference Image (Optional)
                  </label>
                  <ImageUpload 
                    onImageChange={setUploadedImage}
                    disabled={isLoading || isAnalyzing}
                  />
                  {uploadedImage && !imageAnalysis && (
                    <div className="mt-2 flex justify-end">
                      <Button
                        onClick={handleAnalyzeImage}
                        variant="secondary"
                        disabled={isAnalyzing || isLoading}
                      >
                        {isAnalyzing ? "Analyzing..." : "Analyze Image"}
                      </Button>
                    </div>
                  )}
                  {imageAnalysis && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm font-medium text-gray-700">AI Analysis:</p>
                      <p className="text-sm text-gray-600">{imageAnalysis}</p>
                      <div className="mt-2 flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setPrompt(imageAnalysis)}
                          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        >
                          Use as Prompt
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrompt(prompt => prompt ? `${prompt}\nReference image: ${imageAnalysis}` : imageAnalysis)}
                          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        >
                          Add to Prompt
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prompt
                  </label>
                  <TextArea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={imageAnalysis 
                      ? "Enter instructions like 'Change the background to a beach' or 'Make the image more vibrant'" 
                      : "Describe the image you want to generate..."}
                    className="w-full"
                    disabled={isLoading}
                    required
                    rows={5}
                    onFocus={handleTextAreaFocus}
                    onBlur={handleTextAreaBlur}
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <Select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    options={IMAGE_MODELS}
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size
                  </label>
                  <Select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    options={SIZE_OPTIONS}
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quality
                  </label>
                  <Select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    options={QUALITY_OPTIONS}
                    disabled={isLoading || model !== "dall-e-3"}
                  />
                  {model !== "dall-e-3" && (
                    <p className="text-xs text-gray-500 mt-1">HD quality only available with DALL-E 3</p>
                  )}
                </div>
              </div>
              
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading || !prompt.trim()}
              >
                {isLoading ? "Generating..." : "Generate Image"}
              </Button>
              
              {error && (
                <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
                  {error}
                </div>
              )}
            </form>
          </div>
          
          {(isLoading || generatedImage) && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Generated Image</h2>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-64 bg-gray-100 rounded-md">
                  <div className="animate-pulse flex space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              ) : generatedImage && (
                <div>
                  {revisedPrompt && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm font-medium text-gray-700">Revised Prompt:</p>
                      <p className="text-sm text-gray-600">{revisedPrompt}</p>
                    </div>
                  )}
                  
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    {/* Image wrapper with responsive aspect ratio */}
                    <div className="relative w-full" style={{ height: "500px" }}>
                      <Image
                        src={generatedImage}
                        alt="AI Generated Image"
                        fill
                        style={{ objectFit: "contain" }}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-center">
                    <a
                      href={generatedImage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Open Full Size
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
