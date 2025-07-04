
"use client";

import Header from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SolveTab from '@/components/solve-tab';
import HistoryTab from '@/components/history-tab';
import { Button } from '@/components/ui/button';
import { UploadCloud, Pencil, Lightbulb, LineChart, Github, Twitter, Instagram } from "lucide-react";
import Image from 'next/image';

export default function Home() {
  const handleScrollToSolver = () => {
    document.getElementById('solver')?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    {
      icon: <UploadCloud className="w-6 h-6 text-primary" />,
      title: "Upload & Solve",
      description: "Snap a photo of any math problem—from a textbook or your notes—and let our AI handle the rest."
    },
    {
      icon: <Pencil className="w-6 h-6 text-primary" />,
      title: "Draw Equations",
      description: "Sketch out handwritten equations directly on our interactive canvas for quick and intuitive problem-solving."
    },
    {
      icon: <Lightbulb className="w-6 h-6 text-primary" />,
      title: "Detailed Explanations",
      description: "Don't just get the answer. Understand the 'how' with clear, step-by-step breakdowns for every solution."
    },
    {
      icon: <LineChart className="w-6 h-6 text-primary" />,
      title: "Interactive Graphs",
      description: "Visualize plottable functions with dynamic, interactive graphs that you can zoom, pan, and explore."
    }
  ];

  return (
    <div className="flex flex-col h-full">
      <Header />
      <main className="flex-grow overflow-y-auto">
        {/* Hero Section */}
        <section className="relative text-center py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src="/hero-background.png"
              alt="Abstract background"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Solve Math, Instantly
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              From algebra to calculus, Equation Ace uses AI to provide instant solutions and step-by-step explanations. Upload, draw, or type your problem to get started.
            </p>
            <div className="mt-8">
              <Button size="lg" onClick={handleScrollToSolver}>
                Start Solving Now
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-24 bg-card">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-16">
              Why You'll Love Equation Ace
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center p-6 border rounded-lg transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 cursor-pointer">
                  <div className="flex items-center justify-center h-16 w-16 mx-auto rounded-full bg-primary/10 mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* The Actual Solver */}
        <section id="solver" className="w-full bg-background">
           <div className="container mx-auto px-4 py-20 md:py-24">
              <Tabs defaultValue="solve" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto bg-card border">
                  <TabsTrigger value="solve">Solve</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                <TabsContent value="solve" className="mt-6">
                  <SolveTab />
                </TabsContent>
                <TabsContent value="history" className="mt-6">
                  <HistoryTab />
                </TabsContent>
              </Tabs>
           </div>
        </section>
      </main>
      <footer className="bg-card border-t">
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-lg font-bold">Equation Ace</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">The ultimate AI-powered assistant to solve and understand complex mathematical problems instantly.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Quick Links</h4>
              <ul className="mt-2 space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Home</a></li>
                <li><a href="#solver" className="text-sm text-muted-foreground hover:text-primary transition-colors">Solver</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Follow Us</h4>
              <div className="flex justify-center md:justify-start gap-5 mt-3">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Github className="h-5 w-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Equation Ace. Developed by Student of CSM NRIIT.
          </div>
        </div>
      </footer>
    </div>
  );
}
