import BookView from "../book-view";
import book from "../book-data-v2.json";

export default function VersionThree() {
  return <BookView book={book} version="v3" />;
}
