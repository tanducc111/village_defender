/**
 * Generic object pool for reusable entities such as arrows and enemies.
 */

export interface Poolable {
  readonly isActive: boolean;
  resetForPool(): void;
}

export class PoolSystem<TItem extends Poolable> {
  private readonly items: TItem[] = [];

  public constructor(
    private readonly factory: () => TItem,
    initialSize: number,
    private readonly onCreate?: (item: TItem) => void,
  ) {
    for (let index = 0; index < initialSize; index += 1) {
      this.createItem();
    }
  }

  /** Returns an inactive item, growing the pool only when needed. */
  public acquire(): TItem {
    const existingItem = this.items.find((item) => !item.isActive);

    if (existingItem !== undefined) {
      return existingItem;
    }

    return this.createItem();
  }

  /** Releases an item back into the inactive pool. */
  public release(item: TItem): void {
    item.resetForPool();
  }

  /** Releases every item owned by the pool. */
  public releaseAll(): void {
    this.items.forEach((item) => item.resetForPool());
  }

  /** Exposes pooled items for systems that iterate active objects. */
  public getItems(): readonly TItem[] {
    return this.items;
  }

  private createItem(): TItem {
    const item = this.factory();
    item.resetForPool();
    this.items.push(item);
    this.onCreate?.(item);

    return item;
  }
}
