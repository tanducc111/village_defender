import { DEFAULT_CHARACTER_ID, type CharacterId } from '../data/CharacterData';

/**
 * Mutable run state shared by scenes without using global variables.
 */
export class GameSessionState {
  private highScore = 0;
  private selectedCharacterId: CharacterId = DEFAULT_CHARACTER_ID;

  /** Stores the character selected from the character selection scene. */
  public setSelectedCharacterId(characterId: CharacterId): void {
    this.selectedCharacterId = characterId;
  }

  /** Returns the currently selected playable character. */
  public getSelectedCharacterId(): CharacterId {
    return this.selectedCharacterId;
  }

  /** Updates and returns the best score kept for the current app session. */
  public registerFinalScore(score: number): number {
    this.highScore = Math.max(this.highScore, score);

    return this.highScore;
  }

  /** Returns the highest score reached during this app session. */
  public getHighScore(): number {
    return this.highScore;
  }
}
