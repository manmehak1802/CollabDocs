module.exports = (err, req, res, next) => {
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  if (err.code === 11000) return res.status(400).json({ message: 'Already exists' });
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};