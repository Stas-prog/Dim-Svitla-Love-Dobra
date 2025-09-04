type Offer = { roomId: string; from: string; sdp: any; createdAt: string };
type Answer = { roomId: string; from: string; to: string; sdp: any; createdAt: string };
type Cand = { roomId: string; from: string; ice: any; createdAt: string };

type Store = {
  offers: Offer[];
  answers: Answer[];
  cands: Cand[];
};

const g = globalThis as any;
if (!g.__WRTC_STORE__) {
  g.__WRTC_STORE__ = { offers: [], answers: [], cands: [] } as Store;
}
const S: Store = g.__WRTC_STORE__;

export const memStore = {
  pushOffer(o: Offer) { S.offers.push(o); },
  popOffer(roomId: string) {
    for (let i = S.offers.length - 1; i >= 0; i--) {
      if (S.offers[i].roomId === roomId) return S.offers.splice(i, 1)[0];
    }
    return null;
  },

  pushAnswer(a: Answer) { S.answers.push(a); },
  popAnswer(roomId: string, to: string) {
    for (let i = S.answers.length - 1; i >= 0; i--) {
      if (S.answers[i].roomId === roomId && S.answers[i].to === to) {
        return S.answers.splice(i, 1)[0];
      }
    }
    return null;
  },

  pushCand(c: Cand) { S.cands.push(c); },
  popCands(roomId: string, me: string) {
    const res: Cand[] = [];
    for (let i = S.cands.length - 1; i >= 0; i--) {
      if (S.cands[i].roomId === roomId && S.cands[i].from !== me) {
        res.push(S.cands.splice(i, 1)[0]);
      }
    }
    return res.reverse();
  },
};
