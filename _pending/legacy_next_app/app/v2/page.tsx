import BookView from "../book-view";
import book from "../book-data-v2.json";

export default function VersionTwo() {
  return <BookView book={book} version="v2" />;
}
