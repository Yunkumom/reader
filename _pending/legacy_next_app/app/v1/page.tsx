import BookView from "../book-view";
import book from "../book-data-v1.json";

export default function VersionOne() {
  return <BookView book={book} version="v1" />;
}
