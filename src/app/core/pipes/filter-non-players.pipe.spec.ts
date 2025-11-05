import { FilterNonPlayersPipe } from './filter-non-players.pipe';

describe('FilterNonPlayersPipe', () => {
  it('create an instance', () => {
    const pipe = new FilterNonPlayersPipe();
    expect(pipe).toBeTruthy();
  });
});
