export default function FileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = () => {
            const result = reader.result;
            if (result) {
                resolve(result as string);
            } else {
                reject(new Error("Failed to read file"));
            }
        };

        reader.onerror = () => {
            reject(new Error("Error reading file"));
        };

        reader.readAsDataURL(file);
    });
}