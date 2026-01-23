
export const downloadFile = async (url: string, filename: string) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;

        let finalFilename = filename;
        // Ensure PDF extension if generic file
        if (!finalFilename.toLowerCase().endsWith('.pdf') &&
            !finalFilename.toLowerCase().endsWith('.doc') &&
            !finalFilename.toLowerCase().endsWith('.docx')) {
            finalFilename += '.pdf';
        }

        link.download = finalFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error("Download failed:", error);
        // Fallback to direct link opening if fetch fails (e.g. CORS error)
        window.open(url, '_blank');
    }
};
