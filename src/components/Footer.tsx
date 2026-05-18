export default function Footer() {
  return (
    <footer className="mt-10">
      <div className="rounded-2xl bg-white/70 border border-black/5 p-6 text-center text-sm text-neutral-600">
        <div className="flex flex-wrap justify-center gap-4">
          <a className="link link-hover">About</a>
          <a className="link link-hover">Support</a>
          <a className="link link-hover">FAQ</a>
          <a className="link link-hover">Terms & Privacy</a>
        </div>
        <div className="mt-3 opacity-70">© Dream Loop Cozy Game Store</div>
      </div>
    </footer>
  );
}
