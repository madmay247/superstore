/* Any address that isn't a store or the editor */
export default function NotFound() {
  return (
    <div className="pub pub-missing">
      <h1>Page not found</h1>
      <p>This link doesn’t go anywhere.</p>
      <a className="pub-home" href="/">Build your own store</a>
    </div>
  );
}
