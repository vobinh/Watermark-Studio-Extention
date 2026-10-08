/**
 * Generates instant high-resolution transparent PNG sample logos (512x512)
 * so users can test logo watermarking immediately.
 */

export function generateSampleLogo(): Promise<string> {
  return generatePresetShapeLogo('shield');
}

export type PresetShapeType = 'heart' | 'star' | 'circle' | 'shield' | 'diamond';

export function generatePresetShapeLogo(shape: PresetShapeType): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const cx = 256;
    const cy = 256;

    ctx.save();

    if (shape === 'heart') {
      // HEART LOGO
      ctx.translate(cx, cy - 20);
      const w = 380;
      const h = 360;

      // Outer glow/shadow
      ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
      ctx.shadowBlur = 24;

      // Heart Path
      ctx.beginPath();
      ctx.moveTo(0, h * 0.45);
      ctx.bezierCurveTo(-w * 0.5, h * 0.1, -w * 0.55, -h * 0.35, 0, -h * 0.15);
      ctx.bezierCurveTo(w * 0.55, -h * 0.35, w * 0.5, h * 0.1, 0, h * 0.45);
      ctx.closePath();

      // Red-rose gradient fill
      const grad = ctx.createLinearGradient(0, -h * 0.35, 0, h * 0.45);
      grad.addColorStop(0, '#f43f5e'); // Rose
      grad.addColorStop(0.5, '#ef4444'); // Red
      grad.addColorStop(1, '#991b1b'); // Dark red
      ctx.fillStyle = grad;
      ctx.fill();

      // White outline stroke
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Inner subtle dashed ring
      ctx.shadowColor = 'transparent';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.35);
      ctx.bezierCurveTo(-w * 0.42, h * 0.08, -w * 0.46, -h * 0.28, 0, -h * 0.1);
      ctx.bezierCurveTo(w * 0.46, -h * 0.28, w * 0.42, h * 0.08, 0, h * 0.35);
      ctx.closePath();
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.stroke();

      // Heart label
      ctx.font = 'bold 32px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('WITH LOVE', 0, 10);
    } else if (shape === 'star') {
      // STAR LOGO
      ctx.translate(cx, cy);

      const spikes = 5;
      const outerR = 210;
      const innerR = 95;

      ctx.shadowColor = 'rgba(234, 179, 8, 0.5)';
      ctx.shadowBlur = 24;

      ctx.beginPath();
      let rot = (Math.PI / 2) * 3;
      let x = 0;
      let y = 0;
      const step = Math.PI / spikes;

      ctx.moveTo(0, -outerR);
      for (let i = 0; i < spikes; i++) {
        x = Math.cos(rot) * outerR;
        y = Math.sin(rot) * outerR;
        ctx.lineTo(x, y);
        rot += step;

        x = Math.cos(rot) * innerR;
        y = Math.sin(rot) * innerR;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.closePath();

      // Gold gradient
      const grad = ctx.createLinearGradient(0, -outerR, 0, outerR);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.4, '#eab308');
      grad.addColorStop(1, '#a16207');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.lineWidth = 10;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TOP BRAND', 0, 0);
    } else if (shape === 'circle') {
      // CIRCLE STAMP SEAL
      ctx.translate(cx, cy);

      ctx.shadowColor = 'rgba(14, 165, 233, 0.4)';
      ctx.shadowBlur = 20;

      // Outer circle
      ctx.beginPath();
      ctx.arc(0, 0, 210, 0, Math.PI * 2);
      const grad = ctx.createLinearGradient(0, -210, 0, 210);
      grad.addColorStop(0, '#38bdf8');
      grad.addColorStop(1, '#0284c7');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.lineWidth = 12;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Dashed inner circle
      ctx.shadowColor = 'transparent';
      ctx.beginPath();
      ctx.arc(0, 0, 180, 0, Math.PI * 2);
      ctx.setLineDash([10, 8]);
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = 'bold 36px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ORIGINAL', 0, -25);

      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#e0f2fe';
      ctx.fillText('★ OFFICIAL SEAL ★', 0, 25);
    } else if (shape === 'diamond') {
      // DIAMOND LOGO
      ctx.translate(cx, cy);

      ctx.shadowColor = 'rgba(168, 85, 247, 0.4)';
      ctx.shadowBlur = 20;

      ctx.beginPath();
      ctx.moveTo(0, -200);
      ctx.lineTo(200, 0);
      ctx.lineTo(0, 200);
      ctx.lineTo(-200, 0);
      ctx.closePath();

      const grad = ctx.createLinearGradient(-150, -150, 150, 150);
      grad.addColorStop(0, '#c084fc');
      grad.addColorStop(0.5, '#9333ea');
      grad.addColorStop(1, '#581c87');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.lineWidth = 12;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DIAMOND', 0, -15);

      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#f3e8ff';
      ctx.fillText('PREMIUM', 0, 25);
    } else {
      // SHIELD LOGO (default)
      ctx.beginPath();
      ctx.arc(cx, cy, 230, 0, Math.PI * 2);
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 206, 0, Math.PI * 2);
      ctx.setLineDash([12, 10]);
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#818cf8';
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(cx, cy, 184, 0, Math.PI * 2);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 180);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
      grad.addColorStop(1, 'rgba(99, 102, 241, 0.15)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Shield in center
      ctx.beginPath();
      ctx.moveTo(cx, cy - 90);
      ctx.lineTo(cx + 80, cy - 30);
      ctx.lineTo(cx + 60, cy + 60);
      ctx.lineTo(cx, cy + 100);
      ctx.lineTo(cx - 60, cy + 60);
      ctx.lineTo(cx - 80, cy - 30);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowColor = 'transparent';

      ctx.font = 'bold 26px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('STUDIO LOGO', cx, cy + 45);

      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('VERIFIED BADGE', cx, cy + 70);
    }

    ctx.restore();
    resolve(canvas.toDataURL('image/png'));
  });
}
