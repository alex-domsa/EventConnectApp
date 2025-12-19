const User = require('../models/user');
const { connect , closeDatabase, clearDatabase } = require('./db-handler');

beforeAll(async () => {
    await connect();
});

afterEach(async () => {
    await clearDatabase();
});

afterAll(async () => {
    await closeDatabase();
}
);

test('Create & save user successfully', async () => {
    const validUser = new User({ email: 'test@example.com', password: 'password123' });
    const savedUser = await validUser.save();
    expect(savedUser._id).toBeDefined();
    expect(savedUser.email).toBe('test@example.com');
    expect(savedUser.password).toBe('password123');
});

test('Insert user successfully, but the field not defined in schema should be undefined', async () => {
    const userWithInvalidField = new User({ email: 'test2@example.com', password: 'password123', nickname: 'nickname123' });
    const savedUser = await userWithInvalidField.save();
    expect(savedUser._id).toBeDefined();
    expect(savedUser.email).toBe('test2@example.com');
    expect(savedUser.password).toBe('password123');
    expect(savedUser.nickname).toBeUndefined();
});

// new tests below

test('should fail validation when email is missing', async () => {
    const user = new User({ password: 'password123' });
    await expect(user.save()).rejects.toThrow();
});

test('should fail validation when password is missing', async () => {
    const user = new User({ email: 'no-pass@example.com' });
    await expect(user.save()).rejects.toThrow();
});

test('should prevent duplicate emails', async () => {
    const u1 = new User({ email: 'dup@example.com', password: 'pw1' });
    await u1.save();

    const u2 = new User({ email: 'dup@example.com', password: 'pw2' });
    await expect(u2.save()).rejects.toThrow();
});

test('findById returns the created user', async () => {
    const u = new User({ email: 'findme@example.com', password: 'findpw' });
    const saved = await u.save();
    const found = await User.findById(saved._id).lean();
    expect(found).not.toBeNull();
    expect(found.email).toBe('findme@example.com');
});

test('delete removes the user', async () => {
    const u = new User({ email: 'del@example.com', password: 'delpw' });
    const saved = await u.save();
    await User.deleteOne({ _id: saved._id });
    const again = await User.findById(saved._id);
    expect(again).toBeNull();
});