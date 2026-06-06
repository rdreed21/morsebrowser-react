const licwLogo = '/assets/CW-Club-logo-clear400-300x300.png';
import downloadSvg from 'bootstrap-icons/icons/download.svg';
import volumeSvg from 'bootstrap-icons/icons/volume-up.svg';
import bookSvg from 'bootstrap-icons/icons/book.svg';
import lockSvg from 'bootstrap-icons/icons/lock.svg';
import unlockSvg from 'bootstrap-icons/icons/unlock.svg';
import checkSvg from 'bootstrap-icons/icons/check-lg.svg';
import circleSvg from 'bootstrap-icons/icons/circle.svg';
import playSvg from 'bootstrap-icons/icons/play-circle.svg';
import pauseSvg from 'bootstrap-icons/icons/pause-circle.svg';
import eyeSvg from 'bootstrap-icons/icons/eye.svg';
import eyeslashSvg from 'bootstrap-icons/icons/eye-slash.svg';
import speedometerSvg from 'bootstrap-icons/icons/speedometer2.svg';
import stopwatchSvg from 'bootstrap-icons/icons/stopwatch.svg';
import shuffleSvg from 'bootstrap-icons/icons/shuffle.svg';
import stopSvg from 'bootstrap-icons/icons/stop-circle.svg';
import arrowrepeatSvg from 'bootstrap-icons/icons/arrow-repeat.svg';
import arrowleftSvg from 'bootstrap-icons/icons/arrow-left.svg';
import uploadSvg from 'bootstrap-icons/icons/upload.svg';
import trashSvg from 'bootstrap-icons/icons/trash.svg';
import chatquoteSvg from 'bootstrap-icons/icons/chat-quote.svg';
import musicnoteSvg from 'bootstrap-icons/icons/music-note.svg';
import grid3x3gapSvg from 'bootstrap-icons/icons/grid-3x3-gap.svg';
import githubSvg from 'bootstrap-icons/icons/github.svg';
import moonSvg from 'bootstrap-icons/icons/moon-stars-fill.svg';
import sunSvg from 'bootstrap-icons/icons/sun-fill.svg';
import volumemuteSvg from 'bootstrap-icons/icons/volume-mute.svg';
import graphuparrowSvg from 'bootstrap-icons/icons/graph-up-arrow.svg';
import barchartSvg from 'bootstrap-icons/icons/bar-chart.svg';
import rockettakeoffSvg from 'bootstrap-icons/icons/rocket-takeoff.svg';
import repeatSvg from 'bootstrap-icons/icons/arrow-repeat.svg';
import soundwaveSvg from 'bootstrap-icons/icons/soundwave.svg';
import spellcheckSvg from 'bootstrap-icons/icons/spellcheck.svg';
import bootstraprebootSvg from 'bootstrap-icons/icons/bootstrap-reboot.svg';
import chatrightdotsSvg from 'bootstrap-icons/icons/chat-right-dots.svg';
import alignendSvg from 'bootstrap-icons/icons/align-end.svg';
import bookshelfSvg from 'bootstrap-icons/icons/bookshelf.svg';
import gearSvg from 'bootstrap-icons/icons/gear.svg';
import hourglassSvg from 'bootstrap-icons/icons/hourglass-split.svg';
import rssSvg from 'bootstrap-icons/icons/rss.svg';

const IMAGE_MAP: Record<string, string> = {
  logoImage: licwLogo,
  volumeImage: volumeSvg,
  downloadImage: downloadSvg,
  lockImage: lockSvg,
  unlockImage: unlockSvg,
  checkImage: checkSvg,
  circleImage: circleSvg,
  playImage: playSvg,
  pauseImage: pauseSvg,
  eyeImage: eyeSvg,
  eyeslashImage: eyeslashSvg,
  speedometerImage: speedometerSvg,
  stopwatchImage: stopwatchSvg,
  shuffleImage: shuffleSvg,
  stopImage: stopSvg,
  arrowrepeatImage: arrowrepeatSvg,
  bookImage: bookSvg,
  uploadImage: uploadSvg,
  trashImage: trashSvg,
  arrowleftImage: arrowleftSvg,
  chatquoteImage: chatquoteSvg,
  musicnoteImage: musicnoteSvg,
  grid3x3gapImage: grid3x3gapSvg,
  githubImage: githubSvg,
  moonImage: moonSvg,
  sunImage: sunSvg,
  volumemuteImage: volumemuteSvg,
  graphuparrowImage: graphuparrowSvg,
  barchartImage: barchartSvg,
  rocketTakeoffImage: rockettakeoffSvg,
  repeatImage: repeatSvg,
  soundwaveImage: soundwaveSvg,
  spellcheckImage: spellcheckSvg,
  bootstrapRebootImage: bootstraprebootSvg,
  chatRightDotsImage: chatrightdotsSvg,
  alignendImage: alignendSvg,
  bookshelfImage: bookshelfSvg,
  gearImage: gearSvg,
  rssImage: rssSvg,
  hourglassImage: hourglassSvg,
};

export function getMorseImageSrc(key: string): string {
  return IMAGE_MAP[key] ?? '';
}
