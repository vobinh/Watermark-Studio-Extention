/**
 * Generates an instant high-resolution sample photo (1920x1280)
 * so users can test watermarking immediately without searching for files.
 */
export function generateSampleImage(): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d')!;

    // Sky gradient (sunset / twilight)
    const skyGradient = ctx.createLinearGradient(0, 0, 0, 800);
    skyGradient.addColorStop(0, '#0f172a');
    skyGradient.addColorStop(0.3, '#1e293b');
    skyGradient.addColorStop(0.6, '#475569');
    skyGradient.addColorStop(0.8, '#f97316');
    skyGradient.addColorStop(1, '#fdba74');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, 1920, 1280);

    // Sun
    const sunGrad = ctx.createRadialGradient(960, 680, 20, 960, 680, 140);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.3, '#fef08a');
    sunGrad.addColorStop(0.8, 'rgba(251, 146, 60, 0.4)');
    sunGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(960, 680, 140, 0, Math.PI * 2);
    ctx.fill();

    // Distant mountain range
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(0, 850);
    ctx.lineTo(250, 620);
    ctx.lineTo(550, 780);
    ctx.lineTo(820, 580);
    ctx.lineTo(1100, 740);
    ctx.lineTo(1420, 560);
    ctx.lineTo(1700, 760);
    ctx.lineTo(1920, 680);
    ctx.lineTo(1920, 1280);
    ctx.lineTo(0, 1280);
    ctx.closePath();
    ctx.fill();

    // Closer mountain range
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, 920);
    ctx.lineTo(380, 720);
    ctx.lineTo(720, 860);
    ctx.lineTo(1050, 710);
    ctx.lineTo(1350, 840);
    ctx.lineTo(1680, 690);
    ctx.lineTo(1920, 810);
    ctx.lineTo(1920, 1280);
    ctx.lineTo(0, 1280);
    ctx.closePath();
    ctx.fill();

    // Calm lake reflection
    const waterGradient = ctx.createLinearGradient(0, 880, 0, 1280);
    waterGradient.addColorStop(0, '#0f172a');
    waterGradient.addColorStop(0.5, '#1e1b4b');
    waterGradient.addColorStop(1, '#020617');
    ctx.fillStyle = waterGradient;
    ctx.fillRect(0, 880, 1920, 400);

    // Lake light glow
    const reflectGrad = ctx.createLinearGradient(960, 880, 960, 1150);
    reflectGrad.addColorStop(0, 'rgba(253, 186, 116, 0.45)');
    reflectGrad.addColorStop(0.6, 'rgba(249, 115, 22, 0.15)');
    reflectGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = reflectGrad;
    ctx.fillRect(800, 880, 320, 270);

    // Silhouette pines foreground
    ctx.fillStyle = '#090d16';
    const drawTree = (baseX: number, baseY: number, h: number) => {
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.lineTo(baseX - h * 0.25, baseY);
      ctx.lineTo(baseX, baseY - h);
      ctx.lineTo(baseX + h * 0.25, baseY);
      ctx.closePath();
      ctx.fill();
    };

    [80, 140, 220, 310, 1650, 1720, 1800, 1880].forEach((x, i) => {
      drawTree(x, 1050 + (i % 3) * 30, 200 + (i % 4) * 40);
    });

    // Subtitle badge on sample
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '600 28px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Sample Landscape 4K • 1920×1280', 1860, 1220);

    resolve(canvas.toDataURL('image/jpeg', 0.95));
  });
}
