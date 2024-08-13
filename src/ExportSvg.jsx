const exportSvg = (svgElement, fileName = 'exported-graph.svg') => {
    if (!svgElement) return;
  
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
  
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  };
  
  export default exportSvg;
  