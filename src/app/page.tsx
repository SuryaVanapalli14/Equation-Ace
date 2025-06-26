"use client";

import Header from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SolveTab from '@/components/solve-tab';
import HistoryTab from '@/components/history-tab';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
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
      </main>
    </div>
  );
}
