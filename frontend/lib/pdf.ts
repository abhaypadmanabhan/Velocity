// frontend/lib/pdf.ts
import type { Book, Chapter } from "@/types"

// pdfjs-dist must be dynamically imported in Next.js to avoid SSR issues
async function getPdfJs() {
  const pdfjs = await import("pdfjs-dist")
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
  return pdfjs
}

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter((w) => w.length > 0)
}

export async function extractPdf(file: File): Promise<Omit<Book, "id" | "filename" | "createdAt">> {
  const pdfjs = await getPdfJs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise

  const allWords: string[] = []
  const chapters: Omit<Chapter, "id" | "bookId">[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
    const words = splitWords(pageText)
    if (words.length === 0) continue

    chapters.push({
      title: `Page ${i}`,
      index: chapters.length,
      wordStart: allWords.length,
      wordEnd: allWords.length + words.length - 1,
      words,
    })
    allWords.push(...words)
  }

  if (chapters.length === 0) {
    throw new Error("No text found in PDF")
  }

  return {
    title: file.name.replace(/\.pdf$/i, ""),
    author: null,
    totalWords: allWords.length,
    chapters: chapters as Chapter[],
  }
}
