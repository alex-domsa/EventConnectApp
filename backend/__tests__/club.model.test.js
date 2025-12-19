const Club = require('../models/club');
const { connect, closeDatabase, clearDatabase } = require('./db-handler');

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

test('Create & save club successfully', async () => {
  const valid = new Club({ name: 'Chess Club', description: 'Weekly chess meetup' });
  const saved = await valid.save();
  expect(saved._id).toBeDefined();
  expect(saved.name).toBe('Chess Club');
  expect(saved.description).toBe('Weekly chess meetup');
});

test('Unknown fields are not persisted on club', async () => {
  const withExtra = new Club({ name: 'Music', description: 'Music club', fakeField: 'shouldNotExist' });
  const saved = await withExtra.save();
  expect(saved._id).toBeDefined();
  // schema should drop unknown props
  expect(saved.fakeField).toBeUndefined();
});

test('findById returns the created club', async () => {
  const c = new Club({ name: 'Drama', description: 'Drama society' });
  const saved = await c.save();
  const found = await Club.findById(saved._id).lean();
  expect(found).not.toBeNull();
  expect(found.name).toBe('Drama');
});

test('delete removes the club', async () => {
  const c = new Club({ name: 'RemoveMe', description: 'Temporary club' });
  const saved = await c.save();
  await Club.deleteOne({ _id: saved._id });
  const again = await Club.findById(saved._id);
  expect(again).toBeNull();
});
