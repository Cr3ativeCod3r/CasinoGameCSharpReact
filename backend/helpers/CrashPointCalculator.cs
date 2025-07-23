using System;
using System.Globalization;
using System.Numerics;
using System.Security.Cryptography;
using System.Text;

namespace backend.Utils
{
    public static class CrashPointCalculator
    {
        public static double GetCrashPoint(string serverSeed, string gameId)
        {
            string hash = GenerateHmacSha256(serverSeed, gameId);

            if (IsDivisible(hash, 100))
                return 1.00;

            string hex = hash.Substring(0, 13);
            BigInteger h = BigInteger.Parse("0" + hex, NumberStyles.HexNumber);
            double e = Math.Pow(2, 52);

            double result = (e - (double)(h) / 50) / (e - (double)h);
            return Math.Floor(result * 100) / 100;
        }

        private static string GenerateHmacSha256(string key, string message)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
            var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(message));
            var sb = new StringBuilder();
            foreach (var b in hashBytes)
                sb.Append(b.ToString("x2"));
            return sb.ToString();
        }

        private static bool IsDivisible(string hash, int mod)
        {
            BigInteger val = 0;
            int len = hash.Length;
            int offset = len % 4;

            for (int i = offset > 0 ? offset - 4 : 0; i < len; i += 4)
            {
                string part = hash.Substring(i, Math.Min(4, len - i));
                val = ((val << 16) + BigInteger.Parse("0" + part, NumberStyles.HexNumber)) % mod;
            }

            return val == 0;
        }
    }
}