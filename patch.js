const fs = require('fs');
const file = 'c:/Users/user3/Desktop/cocpit/cocpit-frontend/src/components/showcase/UserStorySlide.tsx';
let data = fs.readFileSync(file, 'utf8');
data = data.replace('{/* Description Overlay */}', `{/* DEMO DEBUG BOX */}<div className="absolute top-32 left-4 right-4 bg-black/80 text-white font-mono text-[10px] p-4 z-50 pointer-events-auto break-all">STORY ID: {currentStory?.id}<br />SHARED POST EXISTS: {currentStory?.shared_post ? 'YES' : 'NO'}<br />JSON: {JSON.stringify(currentStory?.shared_post || null)}</div>{/* Description Overlay */}`);
fs.writeFileSync(file, data);
