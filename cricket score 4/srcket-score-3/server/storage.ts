import { matchData, type MatchData, type InsertMatchData, type GridData } from "@shared/schema";

export interface IStorage {
  getMatchData(): Promise<MatchData[]>;
  insertMatchData(data: InsertMatchData): Promise<MatchData>;
  clearMatchData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private matchDataStore: MatchData[];
  private currentId: number;

  constructor() {
    this.matchDataStore = [];
    this.currentId = 1;
  }

  async getMatchData(): Promise<MatchData[]> {
    return this.matchDataStore;
  }

  async insertMatchData(data: InsertMatchData): Promise<MatchData> {
    const newMatchData: MatchData = {
      id: this.currentId++,
      ...data,
    };
    this.matchDataStore.push(newMatchData);
    return newMatchData;
  }

  async clearMatchData(): Promise<void> {
    this.matchDataStore = [];
  }
}

export const storage = new MemStorage();
