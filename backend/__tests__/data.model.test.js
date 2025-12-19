const Data = require('../models/data');
const User = require('../models/user');
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

test('Create & save data/event successfully', async () => {
  const user = await User.create({ email: 'eventuser@example.com', password: 'pw123456' });
  const club = await Club.create({ name: 'Test Club', description: 'Club for testing' });

  const sample = new Data({
    eventName: 'Sample Event',
    date: '2025-01-01',
    startTime: '10:00',
    endTime: '12:00',
    location: 'Main Hall',
    description: 'Test event',
    createdBy: user._id,
    clubId: club._id
  });
  const saved = await sample.save();
  expect(saved._id).toBeDefined();
  expect(saved.eventName).toBe('Sample Event');
  expect(saved.location).toBe('Main Hall');
});

test('Unknown fields are not persisted on data model', async () => {
  const user = await User.create({ email: 'eventuser2@example.com', password: 'pw123456' });
  const club = await Club.create({ name: 'Test Club 2', description: 'Club for testing 2' });

  const withExtra = new Data({
    eventName: 'HiddenFieldTest',
    date: '2025-02-02',
    startTime: '09:00',
    endTime: '10:00',
    location: 'Room A',
    description: 'Desc',
    createdBy: user._id,
    clubId: club._id,
    bogus: 'nope'
  });
  const saved = await withExtra.save();
  expect(saved._id).toBeDefined();
  expect(saved.bogus).toBeUndefined();
});

test('findById returns the created data/event', async () => {
  const user = await User.create({ email: 'finduser@example.com', password: 'pw123456' });
  const club = await Club.create({ name: 'Find Club', description: 'Find club desc' });

  const d = new Data({
    eventName: 'FindMeEvent',
    date: '2025-03-03',
    startTime: '11:00',
    endTime: '12:00',
    location: 'Auditorium',
    description: 'Find me',
    createdBy: user._id,
    clubId: club._id
  });
  const saved = await d.save();
  const found = await Data.findById(saved._id).lean();
  expect(found).not.toBeNull();
  expect(found.eventName).toBe('FindMeEvent');
});

test('delete removes the data/event', async () => {
  const user = await User.create({ email: 'deluser@example.com', password: 'pw123456' });
  const club = await Club.create({ name: 'Del Club', description: 'Del club desc' });

  const d = new Data({
    eventName: 'DeleteMe',
    date: '2025-04-04',
    startTime: '08:00',
    endTime: '09:00',
    location: 'Room Z',
    description: 'To be deleted',
    createdBy: user._id,
    clubId: club._id
  });
  const saved = await d.save();
  await Data.deleteOne({ _id: saved._id });
  const again = await Data.findById(saved._id);
  expect(again).toBeNull();
});
