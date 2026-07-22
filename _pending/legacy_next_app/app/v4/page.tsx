import BookView from "../book-view";
import book from "../book-data-v2.json";
import pdfPageMap from "../pdf-page-map-v4.json";

export default function VersionFour() {
  return <BookView book={book} version="v4" pdfPageMap={pdfPageMap.pageByPairId} pdfTotalPages={pdfPageMap.pdfTotalPages} />;
}
