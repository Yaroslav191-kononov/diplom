export type HexCell = {
  id?: number;
  x: number;
  y: number;
  img: Phaser.GameObjects.Image;
  isCaptured?: boolean;
  lastCollectedTime?: number;
  texture?: string;
  resourceType?: string;
  [key: string]: any;
};

export type HexArrType = [HexCell[], number, number];

export function findNeighbors(
    hexArr: HexCell[],
    cols: number,
    rows: number,
    heroPos: { x: number; y: number }
  ): { [name: string]: HexCell | undefined } {
    let heroIndex = -1;
    let minDist = Infinity;
    hexArr.forEach((cell, i) => {
      const dist = Phaser.Math.Distance.Between(cell.x, cell.y, heroPos.x, heroPos.y);
      if (dist < minDist) {
        minDist = dist;
        heroIndex = i;
      }
    });

    const row = Math.floor(heroIndex / cols);
    const col = heroIndex % cols;
    const offsets = row % 2 === 0
      ? { topLeft: [-1, 0], Other: [-1, -1], topRight: [-1, 1], right: [0, 1], bottomLeft: [1, 0], left: [0, -1] }
      : { Other: [1, 1], topRight: [-1, 0], right: [0, 1], bottomRight: [1, 0], bottomLeft: [1, -1], left: [0, -1] };

    const neighbors: { [name: string]: HexCell | undefined } = {};
    for (const [name, pair] of Object.entries(offsets)) {
      const [x, y] = pair as [number, number];
      let r = row + y;
      let c = col + x;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        neighbors[name] = hexArr[r * cols + c];
      }
    }
    return neighbors;
  }