import { BOARD, gridPosition, type Tile } from '@cotiphu/shared';

function tileDetail(tile: Tile): string | null {
  switch (tile.kind) {
    case 'property':
    case 'station':
    case 'utility':
      return `${tile.price}Đ`;
    case 'tax':
      return `Trả ${tile.amount}Đ`;
    case 'go':
      return 'Nhận 200Đ';
    default:
      return null;
  }
}

export function Board() {
  return (
    <div className="board">
      {BOARD.map((tile) => {
        const { row, col } = gridPosition(tile.index);
        const detail = tileDetail(tile);
        return (
          <div
            key={tile.index}
            className={`tile tile-${tile.kind}`}
            style={{ gridRow: row + 1, gridColumn: col + 1 }}
          >
            <span className="tile-name">{tile.name}</span>
            {detail && <span className="tile-detail">{detail}</span>}
          </div>
        );
      })}
      <div className="board-center">Cờ Tỉ Phú</div>
    </div>
  );
}
