import {
BattleScene
} from "@/views/Battle/Import";
export function startBattle(attackerUnits:any, defenderUnits:any, onFinish:Function) {
  const overlay = document.createElement('div');
  overlay.id = 'battleOverlay';
  Object.assign(overlay.style, { position: 'fixed', inset: '0', padding: '8px' });
  const battleParent = document.createElement('div');
  battleParent.style.width = '100%';
  battleParent.style.height = '100%';
  battleParent.style.borderRadius = '8px';
  battleParent.style.background = '#222';
  battleParent.style.boxShadow = '0 6px 30px rgba(0,0,0,0.7)';
  overlay.appendChild(battleParent);

  document.body.appendChild(overlay);
  (window as any).__battleData = { attackerUnits, defenderUnits };
  (window as any).__overData=undefined;
  const battleGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: battleParent,
    width: window.innerWidth * 0.95,
    height: window.innerHeight * 0.9,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    backgroundColor: '#000000',
    physics: { default: 'arcade' },
    scene: [JSON.parse(localStorage.getItem("BattleBoot") as any), BattleScene]
  });
  let checkIsWin=setInterval(()=>{
    if((window as any).__overData){
      const closeBtn = document.createElement('button');
      closeBtn.innerText = 'Закрыть';
      (closeBtn as any).opacity=0;
      Object.assign(closeBtn.style, {
        position: 'absolute',
        right: '20px',
        top: '20px',
        zIndex: '10000',
        padding: '6px 10px'
      });
      overlay.appendChild(closeBtn);
        closeBtn.addEventListener('click', () => {
        if( (window as any).__overData){
          !battleGame? (battleGame as any).destroy(true):null;
          overlay && overlay.parentNode?overlay.parentNode.removeChild(overlay):null;
          onFinish? onFinish({ cancelled: true }):null;
        }
      });
      clearInterval(checkIsWin);
    }
  });
}