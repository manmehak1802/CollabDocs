import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <div className="relative inline-block">
          <h1 className="text-[8rem] md:text-[13rem] leading-none">
            4<span className="hl">0</span>4
          </h1>
          <span className="absolute -right-6 md:-right-16 top-2 rotate-6 bg-hl border-2 border-ink px-4 py-2 font-hand text-2xl shadow-[4px_4px_0_#14141A]">
            this page wandered off
          </span>
        </div>
        <p className="opacity-70 my-6 text-lg">We couldn’t find what you were looking for.</p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link to="/" className="btn btn-ac">Go home</Link>
          <Link to="/dashboard" className="btn btn-pl">Open dashboard</Link>
        </div>
      </div>
    </div>
  );
}