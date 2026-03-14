export function Footer() {
    return (
        <footer className="bg-[#1e1b4b] border-t border-white/10 py-12 text-white/60 text-sm">
            <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-2xl font-bold text-white tracking-tight">SportSync</div>
                <div className="flex flex-wrap justify-center gap-8">
                    <a href="#" className="hover:text-white transition-colors">Privacy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms</a>
                    <a href="#" className="hover:text-white transition-colors">Safety</a>
                    <a href="#" className="hover:text-white transition-colors">Support</a>
                    <a href="#" className="hover:text-white transition-colors">Press</a>
                    <a href="#" className="hover:text-white transition-colors">Contact</a>
                </div>
                <div>&copy; 2026 SportSync Inc.</div>
            </div>
        </footer>
    )
}
