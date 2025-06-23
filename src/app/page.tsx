"use client";

import Header from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UploadTab from '@/components/upload-tab';
import DrawTab from '@/components/draw-tab';
import HistoryTab from '@/components/history-tab';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto bg-card border">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="draw">Draw</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-6">
            <UploadTab />
          </TabsContent>
          <TabsContent value="draw" className="mt-6">
            <DrawTab />
          </TabsContent>
          <TabsContent value="history" className="mt-6">
            <HistoryTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
